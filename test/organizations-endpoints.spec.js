const knex = require('knex')
const fixtures = require('./organizations-fixtures')
const app = require('../src/app')

describe('Organizations Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('organizations').truncate())

  afterEach('cleanup', () => db('organizations').truncate())

  describe(`Unauthorized requests`, () => {
    const testOrganizations = fixtures.makeOrganizationsArray()

    beforeEach('insert organizations', () => {
      return db
        .into('organizations')
        .insert(testOrganizations)
    })

    it(`responds with 401 Unauthorized for GET /api/organizations`, () => {
      return supertest(app)
        .get('/api/organizations')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/organizations`, () => {
      return supertest(app)
        .post('/api/organizations')
        .send({ org_name: 'test-org' })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/organizations/:id`, () => {
      const secondOrganization = testOrganizations[1]
      return supertest(app)
        .get(`/api/organizations/${secondOrganization.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/organizations/:id`, () => {
      const aOrganization = testOrganizations[1]
      return supertest(app)
        .delete(`/api/organizations/${aOrganization.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for PATCH /api/organizations/:id`, () => {
      const aOrganization = testOrganizations[1]
      return supertest(app)
        .patch(`/api/organizations/${aOrganization.id}`)
        .send({ org_name: 'updated-org-name' })
        .expect(401, { error: 'Unauthorized request' })
    })
  })

  describe('GET /api/organizations', () => {
    context(`Given no organizations`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/organizations')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are organizations in the database', () => {
      const testOrganizations = fixtures.makeOrganizationsArray()

      beforeEach('insert organizations', () => {
        return db
          .into('organizations')
          .insert(testOrganizations)
      })

      it('gets the organizations from the store', () => {
        return supertest(app)
          .get('/api/organizations')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testOrganizations)
      })
    })

    context(`Given an XSS attack organization`, () => {
      const { maliciousOrganization, expectedOrganization } = fixtures.makeMaliciousOrganization()

      beforeEach('insert malicious organization', () => {
        return db
          .into('organizations')
          .insert([maliciousOrganization])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/organizations`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].org_name).to.eql(expectedOrganization.org_name)
          })
      })
    })
  })

  describe('GET /api/organizations/:id', () => {
    context(`Given no organizations`, () => {
      it(`responds 404 whe organization doesn't exist`, () => {
        return supertest(app)
          .get(`/api/organizations/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Organization Not Found` }
          })
      })
    })

    context('Given there are organizations in the database', () => {
      const testOrganizations = fixtures.makeOrganizationsArray()

      beforeEach('insert organizations', () => {
        return db
          .into('organizations')
          .insert(testOrganizations)
      })

      it('responds with 200 and the specified organization', () => {
        const organizationId = 2
        const expectedOrganization = testOrganizations[organizationId - 1]
        return supertest(app)
          .get(`/api/organizations/${organizationId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedOrganization)
      })
    })

    context(`Given an XSS attack organization`, () => {
      const { maliciousOrganization, expectedOrganization } = fixtures.makeMaliciousOrganization()

      beforeEach('insert malicious organization', () => {
        return db
          .into('organizations')
          .insert([maliciousOrganization])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/organizations/${maliciousOrganization.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.org_name).to.eql(expectedOrganization.org_name)
          })
      })
    })
  })

  describe('DELETE /api/organizations/:id', () => {
    context(`Given no organizations`, () => {
      it(`responds 404 whe organization doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/organizations/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Organization Not Found` }
          })
      })
    })

    context('Given there are organizations in the database', () => {
      const testOrganizations = fixtures.makeOrganizationsArray()

      beforeEach('insert organizations', () => {
        return db
          .into('organizations')
          .insert(testOrganizations)
      })

      it('removes the organization by ID from the store', () => {
        const idToRemove = 2
        const expectedOrganizations = testOrganizations.filter(o => o.id !== idToRemove)
        return supertest(app)
          .delete(`/api/organizations/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/organizations`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedOrganizations)
          )
      })
    })
  })

  describe('POST /api/organizations', () => {
    ['org_name'].forEach(field => {
      const newOrganization = {
        org_name: 'test-org-name'
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newOrganization[field]

        return supertest(app)
          .post(`/api/organizations`)
          .send(newOrganization)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })

    it('adds a new organization to the store', () => {
      const newOrganization = {
        org_name: 'test-org-name'
      }
      return supertest(app)
        .post(`/api/organizations`)
        .send(newOrganization)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.org_name).to.eql(newOrganization.org_name)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/organizations/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/organizations/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousOrganization, expectedOrganization } = fixtures.makeMaliciousOrganization()
      return supertest(app)
        .post(`/api/organizations`)
        .send(maliciousOrganization)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.org_name).to.eql(expectedOrganization.org_name)
        })
    })
  })

  describe(`PATCH /api/organizations/:organization_id`, () => {
    context(`Given no organizations`, () => {
      it(`responds with 404`, () => {
        const organizationId = 123456
        return supertest(app)
          .patch(`/api/organizations/${organizationId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Organization Not Found` } })
      })
    })

    context('Given there are organizations in the database', () => {
      const testOrganizations = fixtures.makeOrganizationsArray()

      beforeEach('insert organizations', () => {
        return db
          .into('organizations')
          .insert(testOrganizations)
      })

      it('responds with 204 and updates the organization', () => {
        const idToUpdate = 2
        const updateOrganization = {
          org_name: 'updated organization name'
        }
        const expectedOrganization = {
          ...testOrganizations[idToUpdate - 1],
          ...updateOrganization
        }
        return supertest(app)
          .patch(`/api/organizations/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateOrganization)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/organizations/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedOrganization)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/organizations/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain 'org_name'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateOrganization = {
          org_name: 'updated organization name',
        }
        const expectedOrganization = {
          ...testOrganizations[idToUpdate - 1],
          ...updateOrganization
        }

        return supertest(app)
          .patch(`/api/organizations/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateOrganization,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/organizations/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedOrganization)
          )
      })
    })
  })
})