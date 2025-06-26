
from flask import Flask, request, jsonify, render_template
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

API_KEY = os.getenv("API_FOOTBALL_KEY")
API_HOST = "https://api-football-v1.p.rapidapi.com"
HEADERS = {
    "X-RapidAPI-Key": API_KEY,
    "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    teamA = data.get('teamA', '').strip()
    teamB = data.get('teamB', '').strip()
    if not teamA or not teamB:
        return jsonify({"error": "Both teams are required"}), 400

    def get_team_id(name):
        url = f"{API_HOST}/v3/teams?search={name}"
        resp = requests.get(url, headers=HEADERS).json()
        items = resp.get("response", [])
        return items[0]["team"]["id"] if items else None

    idA, idB = get_team_id(teamA), get_team_id(teamB)
    if not idA or not idB:
        return jsonify({"error": "Team not found"}), 404

    url = f"{API_HOST}/v3/fixtures/headtohead?h2h={idA}-{idB}&last=5"
    resp = requests.get(url, headers=HEADERS).json()
    matches = resp.get("response", [])

    teamA_wins = teamB_wins = draws = goalsA = goalsB = 0
    last5 = []
    for m in matches:
        date = m["fixture"]["date"][:10]
        home = m["teams"]["home"]["name"]
        away = m["teams"]["away"]["name"]
        h, a = m["score"]["fulltime"]["home"], m["score"]["fulltime"]["away"]
        if h > a: winner = home
        elif a > h: winner = away
        else: winner = "Draw"

        if winner.lower() == teamA.lower(): teamA_wins += 1
        elif winner.lower() == teamB.lower(): teamB_wins += 1
        else: draws += 1

        if home.lower() == teamA.lower():
            goalsA += h; goalsB += a
        else:
            goalsA += a; goalsB += h

        last5.append({"date": date, "home": home, "away": away, "score": f"{h}-{a}", "winner": winner})

    total = len(matches) or 1
    avg_goals = round((goalsA + goalsB) / total, 2)
    perc = {
        "teamA": int((teamA_wins/total)*100),
        "teamB": int((teamB_wins/total)*100),
        "draws": int((draws/total)*100)
    }

    return jsonify({
        "prediction": f"{teamA.upper()} vs {teamB.upper()} – Stats Loaded!",
        "total_matches": total,
        "goals": {"teamA": goalsA, "teamB": goalsB},
        "average_goals": avg_goals,
        "percentages": perc,
        "last_5_matches": last5
    })

if __name__ == "__main__":
    app.run(debug=True)
