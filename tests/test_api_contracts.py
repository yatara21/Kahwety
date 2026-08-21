from fastapi.routing import APIRoute

from app.main import app


def test_every_api_route_has_an_explicit_response_model():
    missing = [
        route.path
        for route in app.routes
        if isinstance(route, APIRoute)
        and route.path.startswith("/api/v1")
        and route.response_model is None
    ]

    assert missing == []
