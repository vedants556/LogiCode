import pytest
from datetime import date
import pandas as pd
from unittest.mock import patch, Mock
from requests.exceptions import HTTPError

# Import the classes we created in app.py
from test_commits import GitHubClient, CommitProcessor

# ==========================================
# TEST SUITE 1: Data Processing Logic
# ==========================================
def test_process_commits_empty():
    """Test that an empty API response returns an empty DataFrame."""
    df = CommitProcessor.process_commits_to_df([])
    assert df.empty, "DataFrame should be empty when input list is empty"

def test_process_commits_valid_data():
    """Test that valid JSON is correctly transformed into a DataFrame."""
    # Mock data resembling GitHub API response
    mock_data = [{
        "sha": "1234567890abcdef",
        "commit": {
            "message": "Fix login bug\n\nDetailed description here",
            "author": {"name": "DevOps Dave", "date": "2025-12-01T10:00:00Z"},
            "committer": {"date": "2025-12-02T12:00:00Z"}
        }
    }]

    df = CommitProcessor.process_commits_to_df(mock_data)

    # Assertions
    assert not df.empty
    assert df.iloc[0]["Commit ID (SHA)"] == "1234567"  # Check SHA truncation
    assert df.iloc[0]["Author"] == "DevOps Dave"
    assert df.iloc[0]["Commit Message"] == "Fix login bug" # Check it took only the first line
    
    # Check date conversion
    assert pd.api.types.is_datetime64_any_dtype(df["Author Date"])
    assert pd.api.types.is_datetime64_any_dtype(df["Commit Date"])

# ==========================================
# TEST SUITE 2: GitHub API Client (Mocked)
# ==========================================
@patch('test_commits.requests.get')
def test_fetch_commits_success(mock_get):
    """
    Test that fetch_commits calls the correct URL with correct params.
    We mock requests.get so we don't actually hit GitHub.
    """
    # Setup the mock response
    mock_response = Mock()
    mock_response.json.return_value = [{"some": "data"}]
    mock_response.status_code = 200
    mock_get.return_value = mock_response

    client = GitHubClient(token="fake_token")
    start = date(2025, 1, 1)
    end = date(2025, 1, 31)

    # Run the method
    data = client.fetch_commits("owner", "repo", start, end)

    # Assertions
    assert data == [{"some": "data"}]
    
    # Verify the API was called with the optimization params (since/until)
    mock_get.assert_called_once()
    args, kwargs = mock_get.call_args
    assert "since" in kwargs['params']
    assert "until" in kwargs['params']
    assert kwargs['params']['since'] == "2025-01-01T00:00:00Z"

@patch('test_commits.requests.get')
def test_fetch_commits_404_error(mock_get):
    """Test how the client handles a non-existent repo (404)."""
    # Setup a failure mock
    mock_response = Mock()
    mock_response.raise_for_status.side_effect = HTTPError("404 Client Error")
    mock_response.status_code = 404
    mock_get.return_value = mock_response

    # We need to mock streamlit.error so it doesn't try to render UI during tests
    with patch('test_commits.st.error') as mock_st_error:
        client = GitHubClient()
        data = client.fetch_commits("bad_owner", "bad_repo", date(2025, 1, 1), date(2025, 1, 1))
        
        # It should return an empty list safely, not crash
        assert data == []
        # It should have tried to show an error message
        mock_st_error.assert_called()

# ==========================================
# TEST SUITE 3: Auth Headers
# ==========================================
def test_client_headers():
    """Ensure the token is correctly added to headers."""
    client = GitHubClient(token="secret_abc")
    assert client.headers["Authorization"] == "token secret_abc"

def test_client_no_token():
    """Ensure headers work without a token."""
    client = GitHubClient(token=None)
    assert "Authorization" not in client.headers