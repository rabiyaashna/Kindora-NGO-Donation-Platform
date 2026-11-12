require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CAMPAIGN MODEL
const campaignSchema = new mongoose.Schema({
    id: Number,
    title: String,
    category: String,
    description: String,
    image: String,
    goal: Number,
    raised: { type: Number, default: 0 }
});

const Campaign = mongoose.model("Campaign", campaignSchema);

// DONATION MODEL
const donationSchema = new mongoose.Schema({
    campaignId: Number,
    donorName: String,
    email: String,
    amount: Number,
    date: { type: Date, default: Date.now }
});

const Donation = mongoose.model("Donation", donationSchema);

// VOLUNTEER MODEL
const volunteerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    interest: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Volunteer = mongoose.model("Volunteer", volunteerSchema);

// INITIAL CAMPAIGNS
const initialCampaigns = [
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
];

// GET CAMPAIGNS
app.get("/api/campaigns", async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ id: 1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Unable to load campaigns." });
    }
});

// POST DONATION
app.post("/api/donations", async (req, res) => {
    try {
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

        const campaign = await Campaign.findOneAndUpdate(
            { id: Number(campaignId) },
            { $inc: { raised: Number(amount) } },
            { new: true }
        );

        if (!campaign) {
            return res.status(404).json({
                message: "Campaign not found."
            });
        }

        const donation = await Donation.create({
            campaignId: campaign.id,
            donorName: donorName.trim(),
            email: email.trim(),
            amount: Number(amount)
        });

        res.status(201).json({
            message: "Donation recorded successfully!",
            donation,
            campaign
        });
    } catch (error) {
        res.status(500).json({ message: "Donation failed." });
    }
});

// POST VOLUNTEER
app.post("/api/volunteers", async (req, res) => {
    try {
        const { name, email, phone, interest, message } = req.body;

        if (
            !name?.trim() ||
            !email?.trim() ||
            !phone?.trim() ||
            !interest?.trim()
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        const volunteer = await Volunteer.create({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            interest,
            message: message || ""
        });

        res.status(201).json({
            message: "Volunteer registration successful!",
            volunteer
        });
    } catch (error) {
        res.status(500).json({ message: "Registration failed." });
    }
});

// GET DASHBOARD STATISTICS
app.get("/api/stats", async (req, res) => {
    try {
        const campaigns = await Campaign.countDocuments();
        const donations = await Donation.countDocuments();
        const volunteers = await Volunteer.countDocuments();

        const total = await Campaign.aggregate([
            { $group: { _id: null, amount: { $sum: "$raised" } } }
        ]);

        res.json({
            campaigns,
            donations,
            volunteers,
            totalRaised: total[0]?.amount || 0
        });
    } catch (error) {
        res.status(500).json({ message: "Unable to load statistics." });
    }
});

// CONNECT TO MONGODB AND START SERVER
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        const count = await Campaign.countDocuments();

        if (count === 0) {
            await Campaign.insertMany(initialCampaigns);
            console.log("Initial campaigns added!");
        }

        app.listen(PORT, () => {
            console.log(`Kindora running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();