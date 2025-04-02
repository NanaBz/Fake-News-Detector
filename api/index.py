import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests (for frontend connection)


# Vercel requires this for serverless functions
def handler(event, context):
    from flask import Response

    return Response(app(event, context))


# Load the TF-IDF vectorizer and Naive Bayes model
try:
    with open("tfidf_vectorizer.pkl", "rb") as vec_file:
        vectorizer = pickle.load(vec_file)

    with open("naive_bayes_model.pkl", "rb") as model_file:
        model = pickle.load(model_file)

    # Verify the vectorizer is fitted
    if not hasattr(vectorizer, "vocabulary_"):
        raise ValueError(
            "The TF-IDF vectorizer is not fitted. Make sure it was trained before saving."
        )
except Exception as e:
    raise RuntimeError(f"Error loading model or vectorizer: {e}")

# List of African countries for detection
african_countries = [
    "Nigeria",
    "Kenya",
    "South Africa",
    "Ghana",
    "Ethiopia",
    "Uganda",
    "Tanzania",
    "Algeria",
    "Morocco",
    "Angola",
    "Zimbabwe",
    "Zambia",
    "Botswana",
    "Rwanda",
    "Senegal",
    "Sudan",
    "Somalia",
    "Namibia",
]


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        news_text = data.get("text", "").strip()

        if not news_text:
            return jsonify({"error": "No text provided"}), 400

        # Transform text using the TF-IDF vectorizer
        try:
            text_vectorized = vectorizer.transform([news_text])
        except Exception as e:
            return jsonify({"error": f"Error transforming text: {e}"}), 500

        # Make prediction using the Naïve Bayes model
        try:
            prediction = model.predict(text_vectorized)[0]
            confidence = round(max(model.predict_proba(text_vectorized)[0]) * 100, 2)
        except Exception as e:
            return jsonify({"error": f"Error making prediction: {e}"}), 500

        # Check for African news
        is_african_news = any(country in news_text for country in african_countries)

        # Adjust confidence thresholds
        if confidence < 60:
            if is_african_news:
                return jsonify(
                    {
                        "prediction": "Model uncertain. Dataset may not be well-trained on African news.",
                        "confidence": confidence,
                    }
                )
            else:
                return jsonify({"prediction": "Uncertain", "confidence": confidence})

        return jsonify(
            {
                "prediction": "Fake" if prediction == 1 else "Real",
                "confidence": confidence,
            }
        )

    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500


@app.route("/report", methods=["POST"])
def report():
    data = request.json
    text = data.get("text", "")
    prediction = data.get("prediction", "")

    # Ideally, save reports to a database or log file (for model improvement)

    return jsonify({"message": "Report received"}), 200


@app.route("/history", methods=["GET"])
def get_history():
    # Fetch history from a database or log file (Placeholder data for now)
    history = [
        {"text": "Example news text", "prediction": "Fake", "confidence": 85},
        {"text": "Another example", "prediction": "Real", "confidence": 90},
    ]
    return jsonify({"history": history})


if __name__ == "__main__":
    app.run(debug=True)
