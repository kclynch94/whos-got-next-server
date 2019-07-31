const knex = require('knex')
const fixtures = require('./teams-fixtures')
const app = require('../src/app')

describe('Teams Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('teams').truncate())

  afterEach('cleanup', () => db('teams').truncate())

  describe(`Unauthorized requests`, () => {
    const testTeams = fixtures.makeTeamsArray()

    beforeEach('insert teams', () => {
      return db
        .into('teams')
        .insert(testTeams)
    })

    it(`responds with 401 Unauthorized for GET /api/teams`, () => {
      return supertest(app)
        .get('/api/teams')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/teams`, () => {
      return supertest(app)
        .post('/api/teams')
        .send({ team_name: 'test-team-name', players: ['test-player-1','test-player-2'] })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/teams/:id`, () => {
      const secondTeam = testTeams[1]
      return supertest(app)
        .get(`/api/teams/${secondTeam.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/teams/:id`, () => {
      const aTeam = testTeams[1]
      return supertest(app)
        .delete(`/api/teams/${aTeam.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for PATCH /api/teams/:id`, () => {
      const aTeam = testTeams[1]
      return supertest(app)
        .patch(`/api/teams/${aTeam.id}`)
        .send({ team_name: 'updated-team-name' })
        .expect(401, { error: 'Unauthorized request' })
    })
  })

  describe('GET /api/teams', () => {
    context(`Given no teams`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/teams')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are teams in the database', () => {
      const testTeams = fixtures.makeTeamsArray()

      beforeEach('insert teams', () => {
        return db
          .into('teams')
          .insert(testTeams)
      })

      it('gets the teams from the store', () => {
        return supertest(app)
          .get('/api/teams')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testTeams)
      })
    })

    context(`Given an XSS attack team`, () => {
      const { maliciousTeam, expectedTeam } = fixtures.makeMaliciousTeam()

      beforeEach('insert malicious team', () => {
        return db
          .into('teams')
          .insert([maliciousTeam])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/teams`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].team_name).to.eql(expectedTeam.team_name)
          })
      })
    })
  })

  describe('GET /api/teams/:id', () => {
    context(`Given no teams`, () => {
      it(`responds 404 whe team doesn't exist`, () => {
        return supertest(app)
          .get(`/api/teams/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Team Not Found` }
          })
      })
    })

    context('Given there are teams in the database', () => {
      const testTeams = fixtures.makeTeamsArray()

      beforeEach('insert teams', () => {
        return db
          .into('teams')
          .insert(testTeams)
      })

      it('responds with 200 and the specified team', () => {
        const teamId = 2
        const expectedTeam = testTeams[teamId - 1]
        return supertest(app)
          .get(`/api/teams/${teamId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedTeam)
      })
    })

    context(`Given an XSS attack team`, () => {
      const { maliciousTeam, expectedTeam } = fixtures.makeMaliciousTeam()

      beforeEach('insert malicious team', () => {
        return db
          .into('teams')
          .insert([maliciousTeam])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/teams/${maliciousTeam.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.team_name).to.eql(expectedTeam.team_name)
          })
      })
    })
  })

  describe('DELETE /api/teams/:id', () => {
    context(`Given no teams`, () => {
      it(`responds 404 whe team doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/teams/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Team Not Found` }
          })
      })
    })

    context('Given there are teams in the database', () => {
      const testTeams = fixtures.makeTeamsArray()

      beforeEach('insert teams', () => {
        return db
          .into('teams')
          .insert(testTeams)
      })

      it('removes the team by ID from the store', () => {
        const idToRemove = 2
        const expectedTeams = testTeams.filter(t => t.id !== idToRemove)
        return supertest(app)
          .delete(`/api/teams/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/teams`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedTeams)
          )
      })
    })
  })

  describe('POST /api/teams', () => {
    ['team_name'].forEach(field => {
      const newTeam = {
        team_name: 'test-team-name',
        players: ['test-player-1','test-player-2'],
        court_id: 1,
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newTeam[field]

        return supertest(app)
          .post(`/api/teams`)
          .send(newTeam)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })

    it('adds a new team to the store', () => {
      const newTeam = {
        team_name: 'test-team-name',
        players: ['test-player-1','test-player-2'],
        court_id: 1,
      }
      return supertest(app)
        .post(`/api/teams`)
        .send(newTeam)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.team_name).to.eql(newTeam.team_name)
          expect(res.body.players).to.eql(newTeam.players)
          expect(res.body.court_id).to.eql(newTeam.court_id)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/teams/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/teams/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousTeam, expectedTeam } = fixtures.makeMaliciousTeam()
      return supertest(app)
        .post(`/api/teams`)
        .send(maliciousTeam)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.team_name).to.eql(expectedTeam.team_name)
        })
    })
  })

  describe(`PATCH /api/teams/:team_id`, () => {
    context(`Given no teams`, () => {
      it(`responds with 404`, () => {
        const teamId = 123456
        return supertest(app)
          .patch(`/api/teams/${teamId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Team Not Found` } })
      })
    })

    context('Given there are teams in the database', () => {
      const testTeams = fixtures.makeTeamsArray()

      beforeEach('insert teams', () => {
        return db
          .into('teams')
          .insert(testTeams)
      })

      it('responds with 204 and updates the team', () => {
        const idToUpdate = 2
        const updateTeam = {
          team_name: 'updated team name',
          players: ['updated-test-player-1','updated-test-player-2'],
        }
        const expectedTeam = {
          ...testTeams[idToUpdate - 1],
          ...updateTeam
        }
        return supertest(app)
          .patch(`/api/teams/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateTeam)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/teams/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedTeam)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/teams/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must content either 'team_name' or 'players'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateTeam = {
          team_name: 'updated team name',
        }
        const expectedTeam = {
          ...testTeams[idToUpdate - 1],
          ...updateTeam
        }

        return supertest(app)
          .patch(`/api/teams/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateTeam,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/teams/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedTeam)
          )
      })
    })
  })
})