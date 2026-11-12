
// ============================================
// KINDORA - MAIN JAVASCRIPT
// MongoDB + Express API integration
// ============================================

const API = "/api";

let campaigns = [];
let selectedAmount = 100;
let toastTimer;

// DOM HELPERS

const get = (id) => document.getElementById(id);

function showToast(message) {
  const toast = get("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// LOAD CAMPAIGNS

async function loadCampaigns() {
  const grid = get("campaignGrid");

  try {
    campaigns = await apiRequest("/campaigns");

    if (!Array.isArray(campaigns)) {
      throw new Error("Invalid campaign data received.");
    }

    renderCampaigns();
  } catch (error) {
    console.error("Campaign loading error:", error);
    grid.innerHTML = `
      <p class="error-message">
        Unable to load campaigns. Please check your connection and try again.
      </p>
    `;
  }
}

// DISPLAY CAMPAIGNS

function renderCampaigns() {
  const grid = get("campaignGrid");

  if (campaigns.length === 0) {
    grid.innerHTML = `<p class="loading">No campaigns available right now.</p>`;
    return;
  }

  grid.innerHTML = campaigns.map(campaign => {
    const goal = Number(campaign.goal) || 0;
    const raised = Number(campaign.raised) || 0;

    const percentage = goal > 0
      ? Math.min((raised / goal) * 100, 100)
      : 0;

    const image = campaign.image ||
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900";

    return `
      <article class="campaign-card">
        <div class="campaign-image">
          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(campaign.title)}"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900'"
          >
          <span class="campaign-category">
            ${escapeHTML(campaign.category || "COMMUNITY")}
          </span>
        </div>

        <div class="campaign-info">
          <h3>${escapeHTML(campaign.title)}</h3>
          <p>${escapeHTML(campaign.description || "")}</p>

          <div class="progress-track">
            <div class="progress-fill" style="width:${percentage}%"></div>
          </div>

          <div class="fund-details">
            <span><strong>${formatMoney(raised)}</strong> raised</span>
            <span>Goal ${formatMoney(goal)}</span>
          </div>

          <div class="fund-details">
            <span>${percentage.toFixed(0)}% funded</span>
          </div>

          <button
            class="btn btn-primary"
            onclick="openDonationModal(${Number(campaign.id)})"
          >
            Support This Cause ↗
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// BASIC HTML ESCAPING

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// FORMAT MONEY

function formatMoney(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// LOAD STATISTICS

async function loadStats() {
  try {
    const stats = await apiRequest("/stats");

    get("campaignCount").textContent = stats.campaignCount ?? 0;
    get("donationCount").textContent = stats.donationCount ?? 0;
    get("volunteerCount").textContent = stats.volunteerCount ?? 0;
    get("totalRaised").textContent = formatMoney(stats.totalRaised ?? 0);
  } catch (error) {
    console.error("Statistics loading error:", error);
  }
}

// DONATION MODAL

function openDonationModal(campaignId) {
  const campaign = campaigns.find(
    item => Number(item.id) === Number(campaignId)
  );

  if (!campaign) {
    showToast("Campaign not found.");
    return;
  }

  get("donationCampaignId").value = campaign.id;
  get("modalTitle").textContent = campaign.title;
  get("modalDescription").textContent =
    campaign.description || "Your contribution can make a difference.";

  get("donationForm").reset();
  get("donationStatus").textContent = "";
  get("donationStatus").className = "form-status";
  get("customAmount").value = "";

  selectedAmount = 100;
  updateAmountButtons();

  get("donationModal").classList.add("open");
  get("donationModal").setAttribute("aria-hidden", "false");
}

function closeDonationModal() {
  get("donationModal").classList.remove("open");
  get("donationModal").setAttribute("aria-hidden", "true");
}

get("modalClose").addEventListener("click", closeDonationModal);
get("modalBackdrop").addEventListener("click", closeDonationModal);
get("navDonate").addEventListener("click", () => {
  if (campaigns.length > 0) {
    openDonationModal(campaigns[0].id);
  } else {
    showToast("Please wait for campaigns to load.");
  }
});

// DONATION AMOUNT BUTTONS

document.querySelectorAll(".amount-btn").forEach(button => {
  button.addEventListener("click", () => {
    selectedAmount = Number(button.dataset.amount);
    get("customAmount").value = "";
    updateAmountButtons();
  });
});

function updateAmountButtons() {
  document.querySelectorAll(".amount-btn").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.amount) === selectedAmount
    );
  });
}

// SUBMIT DONATION

get("donationForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = get("donationSubmit");
  const status = get("donationStatus");

  const customAmount = get("customAmount").value.trim();
  const amount = customAmount === ""
    ? selectedAmount
    : Number(customAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    status.textContent = "Enter a valid donation amount.";
    status.className = "form-status error";
    return;
  }

  const payload = {
    campaignId: Number(get("donationCampaignId").value),
    donorName: get("donorName").value.trim(),
    email: get("donorEmail").value.trim(),
    amount
  };

  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const result = await apiRequest("/donations", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    status.textContent = result.message || "Donation recorded successfully!";
    status.className = "form-status success";

    await Promise.all([loadCampaigns(), loadStats()]);

    showToast("Thank you for your kindness!");

    setTimeout(closeDonationModal, 1400);
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-status error";
  } finally {
    button.disabled = false;
    button.textContent = "Confirm Donation ↗";
  }
});

// VOLUNTEER REGISTRATION

get("volunteerForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = get("volunteerSubmit");
  const status = get("volunteerStatus");

  const payload = {
    name: get("volunteerName").value.trim(),
    email: get("volunteerEmail").value.trim(),
    phone: get("volunteerPhone").value.trim(),
    interest: get("volunteerInterest").value,
    message: get("volunteerMessage").value.trim()
  };

  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const result = await apiRequest("/volunteers", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    status.textContent =
      result.message || "Your registration was successful!";

    status.className = "form-status success";

    get("volunteerForm").reset();

    await loadStats();
    showToast("Welcome to the Kindora community!");
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-status error";
  } finally {
    button.disabled = false;
    button.textContent = "Submit Registration ↗";
  }
});

// MOBILE NAVIGATION

get("menuToggle").addEventListener("click", () => {
  get("navigation").classList.toggle("show");
});

document.querySelectorAll("#navigation a").forEach(link => {
  link.addEventListener("click", () => {
    get("navigation").classList.remove("show");
  });
});

// CLOSE MODAL WITH ESCAPE

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDonationModal();
  }
});

// AUTO REFRESH CAMPAIGNS AND STATISTICS

async function refreshData() {
  await Promise.all([loadCampaigns(), loadStats()]);
}

// INITIALIZE

document.addEventListener("DOMContentLoaded", refreshData);

// Refresh data periodically for other visitors' donations.
// Submission by this visitor updates immediately.
setInterval(refreshData, 10000);
