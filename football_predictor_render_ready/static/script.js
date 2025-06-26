
const teamLogos = {
  arsenal: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  barcelona: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
};

document.getElementById("predictForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const teamA = document.getElementById("teamA").value.trim().toLowerCase();
  const teamB = document.getElementById("teamB").value.trim().toLowerCase();

  const logoA = document.getElementById("logoA");
  const logoB = document.getElementById("logoB");
  const resultText = document.getElementById("resultText");
  const vs = document.getElementById("vs");
  const statsBox = document.getElementById("statsBox");

  logoA.style.display = logoB.style.display = "none";
  resultText.textContent = "⏳ Predicting...";
  vs.textContent = "🔄";
  statsBox.innerHTML = "";

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({teamA,teamB})
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (teamLogos[teamA]) {
      logoA.src = teamLogos[teamA]; logoA.style.display = "inline";
    }
    if (teamLogos[teamB]) {
      logoB.src = teamLogos[teamB]; logoB.style.display = "inline";
    }

    resultText.textContent = data.prediction;
    vs.textContent = "⚔️";

    let statsHTML = `<h4>📊 Stats</h4>
      <p><strong>Total Matches:</strong> ${data.total_matches}</p>
      <p><strong>Goals:</strong> ${teamA.toUpperCase()}: ${data.goals.teamA}, ${teamB.toUpperCase()}: ${data.goals.teamB}</p>
      <p><strong>Avg Goals:</strong> ${data.average_goals}</p>
      <p><strong>Win %:</strong> ${teamA.toUpperCase()}: ${data.percentages.teamA}%, ${teamB.toUpperCase()}: ${data.percentages.teamB}%, Draws: ${data.percentages.draws}%</p>
      <h5>Last 5 Matches:</h5><ul>`;
    data.last_5_matches.forEach(m => {
      statsHTML += `<li>${m.date}: ${m.home} vs ${m.away} → ${m.score} (${m.winner})</li>`;
    });
    statsHTML += `</ul>`;
    statsBox.innerHTML = statsHTML;
  } catch (err) {
    resultText.textContent = "❌ " + err.message;
    vs.textContent = "💥";
    console.error(err);
  }
});
