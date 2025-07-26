# Importing.
import json
import logging
from flask import Flask, g, jsonify
import pytest

from ml.utils import request_tracker

# 1. generate_request_id() should return an ID with the correct format.
def test_generate_request_id_format():
    req_id = request_tracker.generate_request_id()
    assert req_id.startswith("req_")
    parts = req_id.split("_")
    assert len(parts) == 3
    assert parts[1].isdigit()

# 2. setup_request_tracking() sets g.request_id.
def test_setup_request_tracking_sets_g_request_id():
    app = Flask(__name__)

    @app.route("/test")
    def test():
        request_tracker.setup_request_tracking()
        return g.request_id

    with app.test_client() as client:
        resp = client.get("/test")
        assert resp.status_code == 200
        assert resp.data.decode().startswith("req_")

# 3. setup_request_tracking() respects X-Request-ID header.
def test_setup_request_tracking_uses_header():
    app = Flask(__name__)

    @app.route("/test")
    def test():
        request_tracker.setup_request_tracking()
        return g.request_id

    with app.test_client() as client:
        resp = client.get("/test", headers={"X-Request-ID": "req_custom_123"})
        assert resp.data.decode() == "req_custom_123"

# 4. log_with_context() logs a JSON message with proper fields.
def test_log_with_context_logs_json(caplog):
    caplog.set_level(logging.INFO)
    app = Flask(__name__)

    with app.app_context():
        g.request_id = "req_test"
        request_tracker.log_with_context("info", "Test message", {"foo": "bar"})

    log = caplog.records[-1]
    assert "[req_test]" in log.getMessage()
    assert hasattr(log, "log_data")
    assert log.log_data["message"] == "Test message"
    assert log.log_data["context"] == {"foo": "bar"}

# 5. log_with_context() falls back to 'unknown' if no request_id is set.
def test_log_with_context_no_request_context(caplog):
    caplog.set_level(logging.INFO)
    app = Flask(__name__)

    with app.app_context():
        if hasattr(g, "request_id"):
            del g.request_id
        request_tracker.log_with_context("info", "Message without context")

    log = caplog.records[-1]
    assert log.log_data["request_id"] == "unknown"

# 6. with_request_tracking() logs start and completion and adds X-Request-ID header.
def test_with_request_tracking_decorator_logs(caplog):
    caplog.set_level(logging.INFO)
    app = Flask(__name__)

    @app.route("/dummy")
    @request_tracker.with_request_tracking
    def dummy():
        return jsonify({"ok": True})

    with app.test_client() as client:
        resp = client.get("/dummy")
        assert resp.status_code == 200
        assert "X-Request-ID" in resp.headers

    messages = [json.loads(r.log_data and json.dumps(r.log_data) or "{}") for r in caplog.records if hasattr(r, "log_data")]
    assert any("ML API Request Started" in r["message"] for r in messages)
    assert any("ML API Request Completed" in r["message"] for r in messages)

# 7. with_request_tracking() logs errors if route raises an exception.
def test_with_request_tracking_catches_exception(caplog):
    app = Flask(__name__)
    app.config["TESTING"] = True  # Make Flask propagate exceptions

    @app.route("/error")
    @request_tracker.with_request_tracking
    def error_route():
        raise ValueError("boom")

    client = app.test_client()

    with caplog.at_level(logging.ERROR):
        with pytest.raises(ValueError):
            client.get("/error")

    logs = [rec.log_data for rec in caplog.records if hasattr(rec, "log_data")]
    assert any("ML API Request Failed" in r["message"] for r in logs)

# 8. get_user_context() returns request info inside a request context.
def test_get_user_context_inside_request():
    app = Flask(__name__)

    @app.route("/ctx")
    def ctx():
        return request_tracker.get_user_context()

    with app.test_client() as client:
        resp = client.get("/ctx?foo=bar", headers={"User-Agent": "pytest"})
        data = json.loads(resp.data)
        assert data["user_agent"] == "pytest"
        assert "foo" in data["args"]
        assert data["method"] == "GET"

# 9. RequestTrackingFormatter outputs JSON if log_data is present.
def test_formatter_with_log_data():
    formatter = request_tracker.RequestTrackingFormatter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="Something", args=(), exc_info=None
    )
    record.log_data = {"test": "value"}
    formatted = formatter.format(record)
    parsed = json.loads(formatted)
    assert parsed["test"] == "value"

# 10. RequestTrackingFormatter falls back to plain string if no log_data is present.
def test_formatter_without_log_data():
    formatter = request_tracker.RequestTrackingFormatter("%(levelname)s: %(message)s")
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="No structured log", args=(), exc_info=None
    )
    result = formatter.format(record)
    assert "No structured log" in result

# 11. setup_logging() creates a logger with the correct handler and formatter.
def test_setup_logging_creates_handler():
    logger = request_tracker.setup_logging()
    assert isinstance(logger, logging.Logger)
    assert len(logger.handlers) == 1
    assert isinstance(logger.handlers[0].formatter, request_tracker.RequestTrackingFormatter)

# 12. RequestTrackingFormatter handles log records with no log_data attribute (final fallback branch).
def test_formatter_handles_missing_log_data_attribute():
    """Covers the code path where log_data is not defined at all."""
    formatter = request_tracker.RequestTrackingFormatter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="Fallback message", args=(), exc_info=None
    )
    # We want the fallback path here.
    formatted = formatter.format(record)
    assert "Fallback message" in formatted