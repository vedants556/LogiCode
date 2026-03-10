import streamlit as st
import requests
import pandas as pd
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any

# ==========================================
# MODULE 1: GITHUB API CLIENT (The Backend)
# ==========================================
class GitHubClient:
    """
    Handles all interactions with the GitHub API.
    Designed to be reusable and decoupled from the UI.
    """
    BASE_URL = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        """
        Initialize with an optional token. 
        DevOps Note: Using a token increases API rate limits significantly 
        (60 requests/hr vs 5000 requests/hr).
        """
        self.headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if token:
            self.headers["Authorization"] = f"token {token}"

    def fetch_commits(self, owner: str, repo: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Fetches commits filtering by date range at the API level.
        
        DevOps Best Practice: We filter using 'since' and 'until' parameters 
        to reduce payload size and latency, rather than fetching all history 
        and filtering in Python.
        """
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/commits"
        
        # Convert date objects to ISO 8601 format required by GitHub (YYYY-MM-DDTHH:MM:SSZ)
        # Adding time to ensure the full day is covered
        params = {
            "since": start_date.isoformat() + "T00:00:00Z",
            "until": end_date.isoformat() + "T23:59:59Z",
            "per_page": 100  # Maximize data per request to reduce HTTP overhead
        }

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status() # Raises HTTPError for bad responses (4xx, 5xx)
            return response.json()
        
        except requests.exceptions.HTTPError as e:
            if response.status_code == 404:
                st.error(f"❌ Repository '{owner}/{repo}' not found.")
            elif response.status_code == 401:
                st.error("❌ Authentication failed. Please check your Access Token.")
            elif response.status_code == 403:
                st.error("❌ API Rate limit exceeded. Please provide a GitHub Token.")
            else:
                st.error(f"❌ HTTP Error: {e}")
            return []
        except Exception as e:
            st.error(f"❌ An unexpected error occurred: {e}")
            return []

# ==========================================
# MODULE 2: DATA PROCESSING (The Logic)
# ==========================================
class CommitProcessor:
    """
    Responsible for transforming raw API JSON into a clean, tabular format.
    """
    @staticmethod
    def process_commits_to_df(commits_data: List[Dict[str, Any]]) -> pd.DataFrame:
        if not commits_data:
            return pd.DataFrame()

        processed_list = []
        for item in commits_data:
            commit = item.get("commit", {})
            author_info = commit.get("author", {})
            committer_info = commit.get("committer", {})
            
            # Extracting the specific fields requested
            entry = {
                "Commit ID (SHA)": item.get("sha", "")[:7], # Short SHA is usually sufficient for display
                "Full SHA": item.get("sha", ""),
                "Commit Message": commit.get("message", "").split('\n')[0], # Only take the first line (title)
                "Author": author_info.get("name", "Unknown"),
                "Author Date": author_info.get("date", ""),
                "Commit Date": committer_info.get("date", "")
            }
            processed_list.append(entry)

        df = pd.DataFrame(processed_list)

        # Convert date strings to actual datetime objects for better sorting/filtering in UI
        if not df.empty:
            df["Author Date"] = pd.to_datetime(df["Author Date"])
            df["Commit Date"] = pd.to_datetime(df["Commit Date"])

        return df

# ==========================================
# MODULE 3: FRONTEND (The UI)
# ==========================================
def main():
    st.set_page_config(page_title="Git Commit Auditor", layout="wide")

    # --- Header ---
    st.title("🛡️ Git Commit Auditor")
    st.markdown("""
    *A tool to inspect repository activity within specific timeframes.*
    """)

    # --- Sidebar: Configuration ---
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # Input: GitHub Token (Optional but recommended)
        github_token = st.text_input(
            "GitHub Access Token (Optional)", 
            type="password",
            help="Required for private repos and to avoid rate limits (60/hr limit for unauthenticated)."
        )
        
        st.divider()
        
        # Input: Repository Details
        default_owner = "streamlit"
        default_repo = "streamlit"
        repo_input = st.text_input("Repository (owner/repo)", value=f"{default_owner}/{default_repo}")
        
        # Input: Date Range
        today = date.today()
        last_month = today - timedelta(days=30)
        
        date_range = st.date_input(
            "Select Date Range",
            value=(last_month, today),
            max_value=today
        )

        fetch_btn = st.button("Fetch Commits", type="primary")

    # --- Main Execution Flow ---
    if fetch_btn:
        # Input Validation
        if "/" not in repo_input:
            st.error("Please enter format: owner/repo")
            return
            
        if isinstance(date_range, tuple) and len(date_range) == 2:
            start_date, end_date = date_range
        else:
            st.error("Please select both a start and end date.")
            return

        owner, repo_name = repo_input.split("/")
        
        # logic execution
        with st.spinner(f"Fetching commits for {owner}/{repo_name}..."):
            # Initialize Client
            client = GitHubClient(token=github_token)
            
            # Fetch Data
            raw_commits = client.fetch_commits(owner, repo_name, start_date, end_date)
            
            # Process Data
            df = CommitProcessor.process_commits_to_df(raw_commits)

        # --- Display Results ---
        if not df.empty:
            st.success(f"Found {len(df)} commits between {start_date} and {end_date}.")
            
            # Metric Cards
            col1, col2, col3 = st.columns(3)
            col1.metric("Total Commits", len(df))
            col1.caption("In selected range")
            
            unique_authors = df['Author'].nunique()
            col2.metric("Active Contributors", unique_authors)
            
            latest_commit = df['Commit Date'].max().strftime('%Y-%m-%d')
            col3.metric("Latest Activity", latest_commit)

            # Main Table
            st.subheader("Commit History")
            
            # Formatting the table for display
            st.dataframe(
                df,
                column_config={
                    "Commit ID (SHA)": st.column_config.TextColumn("SHA", help="Short Commit Hash"),
                    "Author Date": st.column_config.DatetimeColumn("Author Date", format="D MMM YYYY, HH:mm"),
                    "Commit Date": st.column_config.DatetimeColumn("Commit Date", format="D MMM YYYY, HH:mm"),
                },
                use_container_width=True,
                hide_index=True
            )
            
            # DevOps Insight: Explain the difference between dates
            with st.expander("ℹ️ Why represent two dates? (DevOps Context)"):
                st.markdown("""
                In Git, there are two timestamps:
                1. **Author Date:** When the code was originally written.
                2. **Commit Date:** When the code was applied to the repository.
                
                *These differ when commits are cherry-picked, rebased, or amended. 
                Monitoring the difference helps detect rewriting of history.*
                """)

        else:
            st.info("No commits found in this date range.")

if __name__ == "__main__":
    main()