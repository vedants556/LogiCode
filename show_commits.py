import subprocess
import pandas as pd
import sys
from datetime import datetime, date

# --- 1. Configuration Constants ---
# Use the default separator that is highly unlikely to appear in a commit message.
# This makes the output reliable for scripting (DevOps automation).
FIELD_SEPARATOR = "----SEP----"

# Git format string:
# %H: Full commit hash (needed for CI/CD tools, artifact linking, etc.)
# %ad: Author Date (ISO 8601 format)
# %cd: Committer Date (ISO 8601 format)
# %an: Author Name
# %s: Subject (First line of commit message)
GIT_FORMAT = f"%H{FIELD_SEPARATOR}%ad{FIELD_SEPARATOR}%cd{FIELD_SEPARATOR}%an{FIELD_SEPARATOR}%s"

# --- 2. Core Logic Functions ---

def run_git_command(repo_path: str, start_date: str, end_date: str) -> str:
    """
    Executes the 'git log' command to retrieve commit data within the date range.
    
    Args:
        repo_path: Path to the Git repository.
        start_date: Start date for the log (YYYY-MM-DD).
        end_date: End date for the log (YYYY-MM-DD).
        
    Returns:
        The raw string output from the git command.
        
    Raises:
        subprocess.CalledProcessError: If the git command fails (e.g., not a repo).
    """
    
    print(f"🔍 Executing git log for: {repo_path}")
    print(f"📅 Range: {start_date} to {end_date}")

    command = [
        "git",
        "log",
        f"--pretty=format:{GIT_FORMAT}",
        "--date=iso-strict", # Essential for reliable machine-parsing (DevOps standard)
        f"--since={start_date}",
        f"--until={end_date}",
    ]

    try:
        result = subprocess.run(
            command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        # Provide detailed error message, crucial for troubleshooting in a pipeline
        print("\n🚨 ERROR: Failed to execute git command.")
        print(f"   Command: {' '.join(command)}")
        print(f"   Error Output: {e.stderr.strip()}")
        # Re-raise the exception to stop the script
        raise

def parse_git_output(raw_output: str) -> list[dict]:
    """
    Parses the raw git log output into a list of dictionaries.
    
    Args:
        raw_output: The string output from the git command.
        
    Returns:
        A list of dictionaries, where each dict represents a commit.
    """
    if not raw_output:
        return []

    commit_list = []
    # Split the output by lines, then split each line by the custom separator
    for line in raw_output.splitlines():
        # Ensure we only process lines that contain our separator
        if FIELD_SEPARATOR in line:
            fields = line.split(FIELD_SEPARATOR, 4) # Limit split to 4 to keep subject intact
            
            if len(fields) == 5:
                # Cleaning dates by removing timezone info for display, but keeping
                # the original ISO format in the data model (for machine readability)
                # ISO date format is: YYYY-MM-DDTHH:MM:SS+HH:MM
                
                # We strip the timezone info (e.g., "+05:30") for a clean display.
                author_date_display = fields[1].split('+')[0].split('T')[0]
                commit_date_display = fields[2].split('+')[0].split('T')[0]

                commit_list.append({
                    "Full Commit Hash": fields[0],
                    "Commit ID (Short)": fields[0][:7],
                    "Author Date": author_date_display,
                    "Commit Date": commit_date_display,
                    "Author": fields[3],
                    "Subject": fields[4].strip(),
                })
                
    return commit_list

def display_results(data: list[dict]):
    """
    Displays the commit data in a clean, tabular format using pandas.
    
    Args:
        data: List of commit dictionaries.
    """
    if not data:
        print("❌ No commits found in the specified date range.")
        return

    # Use pandas for high-quality, formatted table output
    df = pd.DataFrame(data)
    
    # Select and reorder columns for a clean user view
    display_df = df[['Commit ID (Short)', 'Author Date', 'Commit Date', 'Author', 'Subject']]
    
    # Custom format to clean up the output further
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    pd.set_option('display.colheader_justify', 'left')

    print("\n" + "="*80)
    print(f"📊 Commit History Report ({len(data)} Commits)")
    print("="*80)
    # Use to_markdown() or to_string() for console output
    print(display_df.to_string(index=False))
    print("="*80)

# --- 3. Main Execution and DevOps/Pipeline Entry Point ---

def main(repo_path: str = ".", start_date: str = "2000-01-01", end_date: str = date.today().strftime('%Y-%m-%d')):
    """
    Main function to orchestrate the Git log analysis.
    
    Args:
        repo_path: Path to the repository. Defaults to current directory.
        start_date: Start date for the filter. Defaults to a very old date.
        end_date: End date for the filter. Defaults to today.
    """
    # ---------------------------------------------------------------------
    # DEVOPS / MODULARITY NOTE:
    # In a real pipeline (e.g., Jenkins, GitLab CI), 'main' would be called 
    # with parameters passed as environment variables or command-line arguments.
    # The functions 'run_git_command' and 'parse_git_output' could be 
    # easily imported into another script for further processing (e.g., 
    # generating a JIRA report, calculating code velocity, etc.)
    # ---------------------------------------------------------------------

    try:
        # 1. Execute Git command
        raw_log = run_git_command(repo_path, start_date, end_date)
        
        # 2. Parse and Structure Data
        commit_data = parse_git_output(raw_log)
        
        # 3. Display Results
        display_results(commit_data)
        
    except ImportError:
        print("\n🚨 ERROR: 'pandas' library is required for data display.")
        print("   Please install it: `pip install pandas`")
        sys.exit(1)
    except FileNotFoundError:
        print("\n🚨 ERROR: 'git' command not found. Ensure Git is installed and in PATH.")
        sys.exit(1)
    except subprocess.CalledProcessError:
        # The specific error was already printed in run_git_command
        sys.exit(1)
    except Exception as e:
        print(f"\n🛑 CRITICAL ERROR: An unexpected error occurred: {e}")
        sys.exit(1)


# Command-line entry point (allows user to run the script)
if __name__ == "__main__":
    
    # --- Example Usage (Hardcoded for immediate testing) ---
    # NOTE: Set your actual dates here or pass them as command-line arguments 
    # in a real application.
    DEFAULT_REPO = "."
    DEFAULT_START_DATE = "2025-10-20" # Use a date that covers your sample data
    DEFAULT_END_DATE = "2025-11-01"   # Use a date that covers your sample data

    # A more robust script would use 'argparse' to handle command-line arguments:
    # main(repo_path=sys.argv[1], start_date=sys.argv[2], end_date=sys.argv[3])
    
    main(repo_path=DEFAULT_REPO, start_date=DEFAULT_START_DATE, end_date=DEFAULT_END_DATE)