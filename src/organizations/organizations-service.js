const OrganizationsService = {
    getAllOrganizations(knex) {
        return knex.select('*').from('organizations')
    },
    insertOrg(knex, newOrg) {
        return knex
            .insert(newOrg)
            .into('organizations')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('organizations').select('*').where('id', id).first()       
    },
    deleteOrg(knex, id) {
        return knex('organizations')
            .where({ id })
            .delete()
    },
    updateOrg(knex, id, newOrgFields) {
        return knex('organizations')
        .where({ id })
        .update(newOrgFields)
    },
}

module.exports = OrganizationsService