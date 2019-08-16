## Who's Got Next?

Here is the link to the [live app](https://kclynch94-whos-got-next-app.now.sh/).

## Summary

This app is designed to help local basketball players see what courts have active players. In addition to that, it solves the problem of debating 'Who's Got Next?' or what team is next in line to play on a certain court.

## API Endpoints

The base URL of the API is https://sleepy-coast-68561.herokuapp.com/api

This API is authenticated so only users with a valid API token will be able to access it.

This API has endpoints for the following:
* /organizations
* /teams
* /courts
* /facilities

All of the endpoints have CRUD operations

### Organizations
* id
* org_name

### Teams
* id
* team_name
* players
* court_id

### Courts
* id
* court_name
* activegame
* facility_id

### Facilities
* id
* facility_name
* org_id