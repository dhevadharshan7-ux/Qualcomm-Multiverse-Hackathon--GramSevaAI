"""Offline tests for the scheme chatbot's topic gate — the safety-critical
part (must refuse off-topic questions before they ever reach a model)."""
from orchestrator.scheme_chat import REFUSAL_MESSAGE, _is_on_topic, ask


def test_on_topic_scheme_question_passes_gate():
    assert _is_on_topic("What is PM-KISAN and who is eligible?") is True


def test_on_topic_generic_question_passes_gate():
    assert _is_on_topic("How do I apply for a scholarship?") is True


def test_off_topic_question_blocked():
    assert _is_on_topic("Write me a poem about the ocean") is False


def test_off_topic_irrelevant_question_blocked():
    assert _is_on_topic("What's the weather like today?") is False


def test_ask_refuses_off_topic_without_calling_model():
    response = ask("Tell me a joke")
    assert response.on_topic is False
    assert response.answer == REFUSAL_MESSAGE
    assert response.matched_schemes == []
