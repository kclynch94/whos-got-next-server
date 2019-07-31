const knex = require('knex')
const fixtures = require('./facilities-fixtures')
const app = require('../src/app')

describe('Facilities Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('facilities').truncate())

  afterEach('cleanup', () => db('facilities').truncate())

  describe(`Unauthorized requests`, () => {
    const testFacilities = fixtures.makeFacilitiesArray()

    beforeEach('insert facilities', () => {
      return db
        .into('facilities')
        .insert(testFacilities)
    })

    it(`responds with 401 Unauthorized for GET /api/facilities`, () => {
      return supertest(app)
        .get('/api/facilities')
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for POST /api/facilities`, () => {
      return supertest(app)
        .post('/api/facilities')
        .send({ facility_name: 'test-facility-name', org_id: 1 })
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for GET /api/facilities/:id`, () => {
      const secondFacility = testFacilities[1]
      return supertest(app)
        .get(`/api/facilities/${secondFacility.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for DELETE /api/facilities/:id`, () => {
      const aFacility = testFacilities[1]
      return supertest(app)
        .delete(`/api/facilities/${aFacility.id}`)
        .expect(401, { error: 'Unauthorized request' })
    })

    it(`responds with 401 Unauthorized for PATCH /api/facilities/:id`, () => {
      const aFacility = testFacilities[1]
      return supertest(app)
        .patch(`/api/facilities/${aFacility.id}`)
        .send({ facility_name: 'updated-facility-name' })
        .expect(401, { error: 'Unauthorized request' })
    })
  })

  describe('GET /api/facilities', () => {
    context(`Given no facilities`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/facilities')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are facilities in the database', () => {
      const testFacilities = fixtures.makeFacilitiesArray()

      beforeEach('insert facilities', () => {
        return db
          .into('facilities')
          .insert(testFacilities)
      })

      it('gets the facilities from the store', () => {
        return supertest(app)
          .get('/api/facilities')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testFacilities)
      })
    })

    context(`Given an XSS attack facility`, () => {
      const { maliciousFacility, expectedFacility } = fixtures.makeMaliciousFacility()

      beforeEach('insert malicious facility', () => {
        return db
          .into('facilities')
          .insert([maliciousFacility])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/facilities`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].facility_name).to.eql(expectedFacility.facility_name)
          })
      })
    })
  })

  describe('GET /api/facilities/:id', () => {
    context(`Given no facilities`, () => {
      it(`responds 404 whe facility doesn't exist`, () => {
        return supertest(app)
          .get(`/api/facilities/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Facility Not Found` }
          })
      })
    })

    context('Given there are facilities in the database', () => {
      const testFacilities = fixtures.makeFacilitiesArray()

      beforeEach('insert facilities', () => {
        return db
          .into('facilities')
          .insert(testFacilities)
      })

      it('responds with 200 and the specified facility', () => {
        const facilityId = 2
        const expectedFacility = testFacilities[facilityId - 1]
        return supertest(app)
          .get(`/api/facilities/${facilityId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedFacility)
      })
    })

    context(`Given an XSS attack facility`, () => {
      const { maliciousFacility, expectedFacility } = fixtures.makeMaliciousFacility()

      beforeEach('insert malicious facility', () => {
        return db
          .into('facilities')
          .insert([maliciousFacility])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/facilities/${maliciousFacility.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.facility_name).to.eql(expectedFacility.facility_name)
          })
      })
    })
  })

  describe('DELETE /api/facilities/:id', () => {
    context(`Given no facilities`, () => {
      it(`responds 404 whe facility doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/facilities/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Facility Not Found` }
          })
      })
    })

    context('Given there are facilities in the database', () => {
      const testFacilities = fixtures.makeFacilitiesArray()

      beforeEach('insert facilities', () => {
        return db
          .into('facilities')
          .insert(testFacilities)
      })

      it('removes the facility by ID from the store', () => {
        const idToRemove = 2
        const expectedFacilities = testFacilities.filter(bm => bm.id !== idToRemove)
        return supertest(app)
          .delete(`/api/facilities/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/facilities`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedFacilities)
          )
      })
    })
  })

  describe('POST /api/facilities', () => {
    ['facility_name','org_id'].forEach(field => {
      const newFacility = {
        facility_name: 'test-facility-name',
        org_id: 1,
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newFacility[field]

        return supertest(app)
          .post(`/api/facilities`)
          .send(newFacility)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })

    it('adds a new facility to the store', () => {
      const newFacility = {
        facility_name: 'test-facility-name',
        org_id: 1
      }
      return supertest(app)
        .post(`/api/facilities`)
        .send(newFacility)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.facility_name).to.eql(newFacility.facility_name)
          expect(res.body.org_id).to.eql(newFacility.org_id)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/facilities/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/facilities/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousFacility, expectedFacility } = fixtures.makeMaliciousFacility()
      return supertest(app)
        .post(`/api/facilities`)
        .send(maliciousFacility)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.facility_name).to.eql(expectedFacility.facility_name)
        })
    })
  })

  describe(`PATCH /api/facilities/:facility_id`, () => {
    context(`Given no facilities`, () => {
      it(`responds with 404`, () => {
        const facilityId = 123456
        return supertest(app)
          .patch(`/api/facilities/${facilityId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Facility Not Found` } })
      })
    })

    context('Given there are facilities in the database', () => {
      const testFacilities = fixtures.makeFacilitiesArray()

      beforeEach('insert facilities', () => {
        return db
          .into('facilities')
          .insert(testFacilities)
      })

      it('responds with 204 and updates the facility', () => {
        const idToUpdate = 2
        const updateFacility = {
          facility_name: 'updated facility name'
        }
        const expectedFacility = {
          ...testFacilities[idToUpdate - 1],
          ...updateFacility
        }
        return supertest(app)
          .patch(`/api/facilities/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateFacility)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/facilities/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedFacility)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/facilities/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'facility_name' or 'org_id'`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateFacility = {
          facility_name: 'updated facility name',
        }
        const expectedFacility = {
          ...testFacilities[idToUpdate - 1],
          ...updateFacility
        }

        return supertest(app)
          .patch(`/api/facilities/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateFacility,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/facilities/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedFacility)
          )
      })
    })
  })
})