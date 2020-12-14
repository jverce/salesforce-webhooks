export const remoteSiteSettings = {
  success: `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope
      xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns="http://soap.sforce.com/2006/04/metadata"
    >
      <soapenv:Body>
        <createMetadataResponse>
          <result>
            <fullName>some_name</fullName>
            <success>true</success>
          </result>
        </createMetadataResponse>
      </soapenv:Body>
    </soapenv:Envelope>
  `,
  failure: `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope
      xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns="http://soap.sforce.com/2006/04/metadata"
    >
      <soapenv:Body>
        <createMetadataResponse>
          <result>
            <fullName>some_name</fullName>
            <success>false</success>
          </result>
        </createMetadataResponse>
      </soapenv:Body>
    </soapenv:Envelope>
  `,
};
