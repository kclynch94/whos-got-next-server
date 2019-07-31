const TeamsService = {
    getAllTeams(knex) {
        return knex.select('*').from('teams').orderBy('id')
    },
    insertTeam(knex, newTeam) {
        return knex
            .insert(newTeam)
            .into('teams')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('teams').select('*').where('id', id).first()       
    },
    deleteTeam(knex, id) {
        return knex('teams')
            .where({ id })
            .delete()
    },
    updateTeam(knex, id, newTeamFields) {
        return knex('teams')
        .where({ id })
        .update(newTeamFields)
    },
}

module.exports = TeamsService