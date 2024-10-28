require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('cron');
const fs = require('fs');

// สร้าง instance ของบอท
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// ฟังก์ชันตรวจสอบว่าวันนี้เป็นวันหยุดหรือไม่
function isHoliday() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const holidays = JSON.parse(fs.readFileSync('./holidays.json')).holidays;
    return holidays.includes(today);
}

// ฟังก์ชันสร้างข้อความประจำวัน
function createDailyMessage() {
    const today = new Date();
    const dayOfWeek = today.toLocaleString('th-TH', { weekday: 'long' });
    const day = today.getDate();
    const month = today.toLocaleString('th-TH', { month: 'long' });

    // สร้างข้อความที่แท็ก role และเพิ่มข้อมูลวันเดือนปี
    const roleMention = `<@&${process.env.ROLE_ID}>`;
    const mainMessage = `${roleMention} วันนี้ ${dayOfWeek} ที่ ${day} ${month} ฉันจะ`;

    return { mainMessage, additionalMessages: ["มาออฟฟิศ", "WFH", "ลากิจ", "ลาป่วย"] };
}

// ตั้งเวลาให้บอทส่งข้อความทุกวันจันทร์-ศุกร์เวลา 8 โมงเช้า
const job = new cron.CronJob('0 8 * * 1-5', async () => {
    if (isHoliday()) {
        console.log("วันนี้เป็นวันหยุด บอทขอนอนก่อนนะ");
        return; // ถ้าเป็นวันหยุด จะไม่ส่งข้อความ
    }

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (channel) {
        const { mainMessage, additionalMessages } = createDailyMessage();
        
        // ส่งข้อความหลัก
        await channel.send(mainMessage);

        // ส่งข้อความเพิ่มเติม
        for (const message of additionalMessages) {
            await channel.send(message);
        }
    }
}, null, true, 'Asia/Bangkok');  // ตั้งเวลาให้เป็นเขตเวลาไทย

// เมื่อตัวบอทออนไลน์
client.once('ready', () => {
    console.log(`${client.user.tag} is now online!`);
    job.start();  // เริ่มการทำงานของ cron job
});

// ล็อกอินบอท
client.login(process.env.DISCORD_TOKEN);
