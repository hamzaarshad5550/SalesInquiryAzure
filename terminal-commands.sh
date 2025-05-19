# Initialize git in your local project (if not already done)
git init

# Add the remote repository
git remote add origin https://github.com/hamzaarshad5550/SalesInquiryAzure.git

# Add all files to staging
git add .

# Commit the changes
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main

# If you get an error about the branch name, try:
# git push -u origin master

# If you need to force push (use with caution):
# git push -f origin main

# If you need to create a new branch:
# git checkout -b main
# git push -u origin main

# If you need to pull changes first:
# git pull origin main --allow-unrelated-histories
