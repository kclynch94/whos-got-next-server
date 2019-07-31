const FacilitiesService = {
    getAllFacilities(knex) {
        return knex.select('*').from('facilities')
    },
    insertFacility(knex, newFacility) {
        return knex
            .insert(newFacility)
            .into('facailities')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('facilities').select('*').where('id', id).first()       
    },
    deleteFacility(knex, id) {
        return knex('facilities')
            .where({ id })
            .delete()
    },
    updateFacilitiy(knex, id, newFacilityFields) {
        return knex('facilities')
        .where({ id })
        .update(newFacilityFields)
    },
}

module.exports = FacilitiesService