const CourtsService = {
    getAllCourts(knex) {
        return knex.select('*').from('courts')
    },
    insertCourt(knex, newCourt) {
        return knex
            .insert(newCourt)
            .into('courts')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('courts').select('*').where('id', id).first()       
    },
    deleteCourt(knex, id) {
        return knex('courts')
            .where({ id })
            .delete()
    },
    updateCourt(knex, id, newCourtFields) {
        return knex('courts')
        .where({ id })
        .update(newCourtFields, ['id','court_name', 'activegame', 'facility_id'])
    },
}

module.exports = CourtsService