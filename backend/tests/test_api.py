"""Backend API tests: health, diabetes prediction, heart placeholder, validation."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert body["database"] == "connected"


def test_models_listing(client):
    r = client.get("/api/v1/models")
    assert r.status_code == 200
    models = {m["disease"]: m for m in r.json()}
    assert "diabetes" in models and "heart_disease" in models
    assert models["diabetes"]["status"] == "ready"
    assert models["heart_disease"]["status"] == "not_ready"
    # Diabetes must have 8 features and a non-default threshold.
    assert len(models["diabetes"]["feature_names"]) == 8
    assert 0 < models["diabetes"]["threshold"] <= 0.5


def test_diabetes_prediction_shape(client, valid_diabetes_payload):
    r = client.post("/api/v1/predict/diabetes", json=valid_diabetes_payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["disease"] == "diabetes"
    assert body["prediction"] in (0, 1)
    assert 0.0 <= body["probability"] <= 1.0
    assert body["risk_band"] in ("Low", "Moderate", "High")
    assert 0.0 < body["threshold"] <= 0.5
    assert isinstance(body["top_factors"], list) and len(body["top_factors"]) > 0
    f0 = body["top_factors"][0]
    assert {"feature", "impact", "direction"} <= set(f0.keys())
    assert f0["direction"] in ("increases_risk", "decreases_risk")
    assert "diagnos" not in body.get("disclaimer", "").lower() or "not a medical" in body["disclaimer"].lower()


def test_heart_placeholder_returns_503(client):
    r = client.post("/api/v1/predict/heart", json={})
    assert r.status_code == 503
    detail = r.json()["detail"]
    assert detail["status"] == "not_ready"
    assert detail["disease"] == "heart_disease"
    # Must not contain fabricated numeric predictions.
    assert "probability" not in detail


def test_heart_statistics_not_ready(client):
    r = client.get("/api/v1/statistics/heart")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "not_ready"


def test_unknown_disease_404(client):
    r = client.post("/api/v1/predict/lung", json={})
    assert r.status_code == 404


def test_missing_input_422(client, valid_diabetes_payload):
    payload = dict(valid_diabetes_payload)
    del payload["Glucose"]
    r = client.post("/api/v1/predict/diabetes", json=payload)
    assert r.status_code == 422


def test_invalid_input_range_422(client, valid_diabetes_payload):
    payload = dict(valid_diabetes_payload)
    payload["Glucose"] = 99999  # outside documented range
    r = client.post("/api/v1/predict/diabetes", json=payload)
    assert r.status_code == 422


def test_extra_input_rejected(client, valid_diabetes_payload):
    payload = dict(valid_diabetes_payload)
    payload["extra_field"] = 1
    r = client.post("/api/v1/predict/diabetes", json=payload)
    assert r.status_code == 422


def test_prediction_persisted(client, valid_diabetes_payload):
    client.post("/api/v1/predict/diabetes", json=valid_diabetes_payload)
    r = client.get("/api/v1/predictions?disease=diabetes")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert body["items"][0]["disease_type"] == "diabetes"


def test_diabetes_analytics(client):
    r = client.get("/api/v1/statistics/diabetes")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ready"
    assert body["n_records"] == 768
    assert "risk_distribution" in body
    assert "feature_importance" in body
    assert "model_performance" in body
