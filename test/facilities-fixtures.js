function makeFacilitiesArray() {
    return [
      {
        id: 1,
        facility_name: 'Test Facility 1',
        org_id: 1,
      },
      {
        id: 2,
        facility_name: 'Test Facility 2',
        org_id: 1,
      },
      {
        id: 3,
        facility_name: 'Test Facility 3',
        org_id: 1,
      },
    ]
  }
  
  function makeMaliciousFacility() {
    const maliciousFacility = {
      id: 911,
      facility_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
      org_id: 1
    }
    const expectedFacility = {
      ...maliciousFacility,
      facility_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
      maliciousFacility,
      expectedFacility,
    }
  }
  
  module.exports = {
    makeFacilitiesArray,
    makeMaliciousFacility,
  }