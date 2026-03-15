import type { RawPoolData, PoolStandings, DivisionKey } from '../types/pool';

const POOLS_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrQdVQ0emQ4m2f7AU6s3fSWWZLoEPapOkuAPFkDA6flCwvAaUxQb_aSlAzwViPTK3jiY0irQqIzM78B-DVt50s5Mh0FUt66q1UxbX5t8hzrpU3S7X9ByUHlp_g0fwwI3bKoe_nlxxUfBNcGYOUgML2b6SGYq-EPCVNPyd96EPZQKJ2vFHkFuP7LKDqrU4FxtHMUDy7dUQkMQR9oYeMF8VVKOTjX-GThPDcm3eLV5u8O2dxIQ8XXJ2N4fvyo3SQEML5tbOEq1zOf9iv_OcPb_fZI0BiQvqxBf5aH6AkFhS-RlLFqC5zk&lib=MEoXfsZS0V3rHY2Z_S8VN8jTDv19RCRyF';

export async function fetchPools(): Promise<PoolStandings[]> {
  const response = await fetch(POOLS_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch pools data');
  }
  const data: RawPoolData = await response.json();
  return transformPoolsData(data);
}

function transformPoolsData(data: RawPoolData): PoolStandings[] {
  const divisions: Array<{ division: string; divisionKey: DivisionKey }> = [
    { division: 'Real Mixed', divisionKey: 'Real Mixed Pools' },
    { division: 'Loose Mixed', divisionKey: 'Loose Mixed Pools' },
    { division: 'Open', divisionKey: 'Open Pools' },
    { division: 'Women', divisionKey: 'Women Pools' },
    { division: 'U20', divisionKey: 'U20 Pools' },
    { division: 'U15', divisionKey: 'U15 Pools' },
  ];

  return divisions.map(({ division, divisionKey }) => ({
    division,
    divisionKey,
    pools: data[divisionKey] || [],
  }));
}
