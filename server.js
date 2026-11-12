
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "db.json");

const initialData = {
    campaigns: [
        {
            id: 1,
            title: "Feed a Hungry Child",
            category: "CHILD WELFARE",
            description: "Help provide nutritious meals to children in need.",
            image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900",
            goal: 50000,
            raised: 32500
        },
        {
            id: 2,
            title: "Education for Everyone",
            category: "EDUCATION",
            description: "Give underprivileged children access to education.",
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900",
            goal: 75000,
            raised: 48000
        },
        {
            id: 3,
            title: "Clean Water Initiative",
            category: "ENVIRONMENT",
            description: "Help communities access clean drinking water.",
            image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=900",
            goal: 60000,
            raised: 21000
        }
    ],
    donations: [],
    volunteers: []
};

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET CAMPAIGNS
app.get("/api/campaigns", (req, res) => {
    const db = readDB();
    res.json(db.campaigns);
});

// POST DONATION
app.post("/api/donations", (req, res) => {
    const { campaignId, donorName, email, amount } = req.body;

    if (
        !campaignId ||
        !donorName?.trim() ||
        !email?.trim() ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0
    ) {
        return res.status(400).json({
            message: "Please enter valid donation details."
        });
    }

    const db = readDB();

    const campaign = db.campaigns.find(
        item => item.id === Number(campaignId)
    );

    if (!campaign) {
        return res.status(404).json({
            message: "Campaign not found."
        });
    }

    const donation = {
        id: Date.now(),
        campaignId: campaign.id,
        donorName: donorName.trim(),
        email: email.trim(),
        amount: Number(amount),
        date: new Date().toISOString()
    };

    db.donations.push(donation);
    campaign.raised += donation.amount;

    writeDB(db);

    res.status(201).json({
        message: "Donation recorded successfully!",
        donation,
        campaign
    });
});

// POST VOLUNTEER
app.post("/api/volunteers", (req, res) => {
    const { name, email, phone, interest } = req.body;

    if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim() ||
        !interest?.trim()
    ) {
        return res.status(400).json({
            message: "Please complete all fields."
        });
    }

    const db = readDB();

    const volunteer = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        interest,
        date: new Date().toISOString()
    };

    db.volunteers.push(volunteer);
    writeDB(db);

    res.status(201).json({
        message: "Volunteer registration successful!",
        volunteer
    });
});

// GET DASHBOARD STATISTICS
app.get("/api/stats", (req, res) => {
    const db = readDB();

    res.json({
        campaigns: db.campaigns.length,
        donations: db.donations.length,
        volunteers: db.volunteers.length,
        totalRaised: db.campaigns.reduce(
            (total, campaign) => total + campaign.raised,
            0
        )
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`NGO Platform running at http://localhost:${PORT}`);
});
