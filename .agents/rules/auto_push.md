Always stage (`git add`), commit, and push (`git push`) to remote repository after making code or configuration changes, UNLESS:
1. The user explicitly instructs not to push, OR
2. The change involves potentially dangerous / high-risk operations (e.g., breaking structural changes, unverified production migrations, environment credential edits, or major destructive refactorings) that require explicit user review first.
