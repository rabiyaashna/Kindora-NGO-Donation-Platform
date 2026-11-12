
const API = "/api";

let campaigns = [];
let selectedCampaign = null;
let selectedAmount = 100;

const campaignGrid = document.getElementById("campaignGrid");
const donationModal = document.getElementById("donationModal");
const donationForm = document.getElementById("donationForm");
const customAmount = document.getElementById("customAmount");
const toast = document.getElementById("toast");

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// LOAD CAMPAIGNS
async function loadCampaigns() {
    try {
        const response = await fetch(`${API}/campaigns`);

        if (!response.ok) {
            throw new Error("Unable to load campaigns");
        }

        campaigns = await response.json();
        renderCampaigns();

    } catch (error) {
        campaignGrid.textContent =
            "Unable to load campaigns. Please try again.";

        console.error(error);
    }
}

// DISPLAY CAMPAIGNS
function renderCampaigns() {
    campaignGrid.innerHTML = "";

    campaigns.forEach(campaign => {

        const percentage = Math.min(
            100,
            Math.round((campaign.raised / campaign.goal) * 100)
        );

        const card = document.createElement("article");
        card.className = "campaign-card";

        const image = document.createElement("img");
        image.src = campaign.image;
        image.alt = campaign.title;
        image.loading = "lazy";

        const body = document.createElement("div");
        body.className = "campaign-body";

        const category = document.createElement("span");
        category.className = "category";
        category.textContent = campaign.category;

        const title = document.createElement("h3");
        title.textContent = campaign.title;

        const description = document.createElement("p");
        description.textContent = campaign.description;

        const progressInfo = document.createElement("div");
        progressInfo.className = "progress-info";

        const raised = document.createElement("span");
        raised.textContent = formatCurrency(campaign.raised);

        const percent = document.createElement("span");
        percent.textContent = `${percentage}%`;

        progressInfo.append(raised, percent);

        const track = document.createElement("div");
        track.className = "progress-track";

        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);

        const bottom = document.createElement("div");
        bottom.className = "campaign-bottom";

        const goal = document.createElement("strong");
        goal.textContent = `Goal: ${formatCurrency(campaign.goal)}`;

        const donateButton = document.createElement("button");
        donateButton.className = "donate-btn";
        donateButton.textContent = "Donate ↗";

        donateButton.addEventListener("click", () => {
            openDonationModal(campaign.id);
        });

        bottom.append(goal, donateButton);

        body.append(
            category,
            title,
            description,
            progressInfo,
            track,
            bottom
        );

        card.append(image, body);
        campaignGrid.appendChild(card);
    });
}

// LOAD STATISTICS
async function loadStats() {
    try {
        const response = await fetch(`${API}/stats`);

        if (!response.ok) {
            throw new Error("Unable to load statistics");
        }

        const stats = await response.json();

        document.getElementById("totalRaised").textContent =
            formatCurrency(stats.totalRaised);

        document.getElementById("totalCampaigns").textContent =
            stats.campaigns;

        document.getElementById("totalDonations").textContent =
            stats.donations;

        document.getElementById("totalVolunteers").textContent =
            stats.volunteers;

    } catch (error) {
        console.error(error);
    }
}

// OPEN DONATION MODAL
function openDonationModal(campaignId) {

    selectedCampaign = campaigns.find(
        campaign => campaign.id === campaignId
    );

    if (!selectedCampaign) return;

    document.getElementById("modalCampaignName").textContent =
        selectedCampaign.title;

    selectedAmount = 100;
    customAmount.value = "";

    document.querySelectorAll(".amount-btn").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.amount) === selectedAmount
        );
    });

    document.getElementById("donationMessage").textContent = "";

    donationModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// CLOSE DONATION MODAL
function closeDonationModal() {
    donationModal.classList.remove("active");
    document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener(
    "click",
    closeDonationModal
);

donationModal.addEventListener("click", event => {
    if (event.target === donationModal) {
        closeDonationModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeDonationModal();
    }
});

// SELECT AMOUNT
document.querySelectorAll(".amount-btn").forEach(button => {

    button.addEventListener("click", () => {

        selectedAmount = Number(button.dataset.amount);
        customAmount.value = "";

        document.querySelectorAll(".amount-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
    });

});

// CUSTOM AMOUNT
customAmount.addEventListener("input", () => {

    if (customAmount.value !== "") {

        selectedAmount = Number(customAmount.value);

        document.querySelectorAll(".amount-btn").forEach(btn => {
            btn.classList.remove("active");
        });

    }

});

// SUBMIT DONATION
donationForm.addEventListener("submit", async event => {

    event.preventDefault();

    const amount = Number(customAmount.value || selectedAmount);

    const donorName =
        document.getElementById("donorName").value.trim();

    const email =
        document.getElementById("donorEmail").value.trim();

    const message =
        document.getElementById("donationMessage");

    if (!Number.isFinite(amount) || amount <= 0) {
        message.textContent = "Enter a valid donation amount.";
        return;
    }

    if (!donorName || !email) {
        message.textContent = "Please complete all details.";
        return;
    }

    const submitButton = donationForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Processing...";

    try {

        const response = await fetch(`${API}/donations`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                campaignId: selectedCampaign.id,
                donorName,
                email,
                amount
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Donation failed");
        }

        closeDonationModal();
        donationForm.reset();

        showToast(
            `Thank you! Your ₹${amount} donation pledge was recorded.`
        );

        await Promise.all([
            loadCampaigns(),
            loadStats()
        ]);

    } catch (error) {

        message.textContent = error.message;

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Confirm Donation ♥";

    }

});

// VOLUNTEER REGISTRATION
const volunteerForm =
    document.getElementById("volunteerForm");

volunteerForm.addEventListener("submit", async event => {

    event.preventDefault();

    const message =
        document.getElementById("volunteerMessage");

    const volunteer = {

        name: document.getElementById("volName").value.trim(),

        email: document.getElementById("volEmail").value.trim(),

        phone: document.getElementById("volPhone").value.trim(),

        interest: document.getElementById("volInterest").value

    };

    if (volunteer.phone.length < 10) {
        message.textContent = "Please enter a valid phone number.";
        return;
    }

    const submitButton = volunteerForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Registering...";

    try {

        const response = await fetch(`${API}/volunteers`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(volunteer)

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed");
        }

        volunteerForm.reset();

        message.textContent =
            "Registration successful! Welcome aboard ♥";

        showToast("Welcome to our volunteer community!");

        await loadStats();

    } catch (error) {

        message.textContent = error.message;

    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            "Register as Volunteer ↗";

    }

});

// MOBILE NAVIGATION
const menuToggle =
    document.getElementById("menuToggle");

const nav =
    document.querySelector(".navbar nav");

menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
});

nav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {
        nav.classList.remove("open");
    });

});

// INITIALIZE WEBSITE
async function initializeApp() {

    await Promise.all([
        loadCampaigns(),
        loadStats()
    ]);

}

// AUTOMATIC DATA REFRESH
setInterval(async () => {

    await Promise.all([
        loadCampaigns(),
        loadStats()
    ]);

}, 5000);

initializeApp();
