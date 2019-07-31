function makeOrganizationsArray() {
    return [
      {
        id: 1,
        org_name: 'Test Org 1'
      },
      {
        id: 2,
        org_name: 'Test Org 2'
      },
      {
        id: 3,
        org_name: 'Test Org 3'
      },
    ]
  }
  
  function makeMaliciousOrganization() {
    const maliciousOrganization =  {
        id: 911,
        org_name: 'Naughty naughty very naughty <script>alert("xss");</script>'
      }
    const expectedOrganization = {
      ...maliciousOrganization,
      org_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    }
    return {
      maliciousOrganization,
      expectedOrganization,
    }
  }
  
  module.exports = {
    makeOrganizationsArray,
    makeMaliciousOrganization,
  }