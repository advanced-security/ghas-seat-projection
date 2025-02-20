# GHAS Seat Projection Javascript Action

This action will return the amount and handles of GHAS seats that would be used if GHAS were to be enabled for a specified repository in an organization.

*Note: Will not work on repositories that are public.*

## Inputs

### `organization`

**Required** Organization to be checked

### `repository`

**Required** Repository to be checked, exclude public repositories

### `authentication`

**Required** Authentication method, either 'app' or 'token'

### `token`

**Optional** PAT or already generated GitHub App installation token

### `application-id`

**Optional** Application ID of the GitHub App, used if `authentication` is set to 'app'

### `application-private-key`

**Optional** Private key of the GitHub App, used if `authentication` is set to 'app'

### `installation-id`

**Optional** Installation ID of the GitHub App, used if `authentication` is set to 'app'

## Outputs

### `ghas-seats`

Number of GHAS licences that will be activated

### `ghas-handles`

Array containing all GitHub Handles of the users that will consume a GHAS licence

## Authentication Setup

GitHub app or token setup can be used. GitHub App authentication setup supports two setup options:

1. The action will generates the GitHub App installation token in the run.
2. Use already generated Github App installation token with the token setup specified.

### GitHub App

1. Create a new GitHub App with the following:
   - **Homepage URL:** URL of the repository containing workflow
   - **Webhooks:** Disabled
   - **Repository permissions:**
     - Contents (read-only)
   - **Organization permissions:**
     - Administration (read-only)
     - members (read-only)
2. Generate private key
3. Install the created GitHub App in the organization

### Token

Generate a PAT and specificy option to use token in the action or use an already generated GitHub App installation token.

## Example Implementation

```yaml
...
jobs:
  test:
    runs-on: ubuntu-latest
    name: A job to test the action
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Calculate seats that will be used
        uses: ./ # Uses an action in the root directory
        id: seats
        with:
          organization: xxxxxx
          repository: xxxxxx
          authentication: app
          application-id: xxxxxxx
          application-private-key: ${{ secrets.APP }}
          installation-id: xxxxxx
          # token: ${{ secrets.PAT }}
    
      - name: Get the handles
        run: echo "HANDLES ${{ steps.seats.outputs.ghas-handles}}"

      - name: Get the amount of seats
        run: echo "SEATS THAT WILL BE USED ${{ steps.seats.outputs.ghas-seats}}"
...
```
