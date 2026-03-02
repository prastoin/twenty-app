import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

const TWENTY_API_URL = process.env.TWENTY_API_URL!;
const TWENTY_API_KEY = process.env.TWENTY_API_KEY!;

const APP_PATH = path.resolve(__dirname, '../..');

async function queryMetadataApi<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Metadata API returned ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

describe('Twenty app sync', () => {
  beforeAll(() => {
    if (!TWENTY_API_URL || !TWENTY_API_KEY) {
      throw new Error(
        'TWENTY_API_URL and TWENTY_API_KEY environment variables must be set',
      );
    }
  });

  it('should sync the application into the Twenty instance', () => {
    const output = execSync('yarn sync', {
      cwd: APP_PATH,
      env: {
        ...process.env,
        TWENTY_API_URL,
        TWENTY_API_KEY,
      },
      encoding: 'utf-8',
      timeout: 30_000,
    });

    expect(output).toContain('synced successfully');
  });

  it('should have created the postCard custom object', async () => {
    const query = `
      query {
        objects(paging: { first: 50 }) {
          edges {
            node {
              id
              nameSingular
              namePlural
              labelSingular
              labelPlural
              isCustom
              isActive
              fields(paging: { first: 50 }) {
                edges {
                  node {
                    id
                    name
                    label
                    type
                    isCustom
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await queryMetadataApi<{
      objects: {
        edges: Array<{
          node: {
            id: string;
            nameSingular: string;
            namePlural: string;
            labelSingular: string;
            labelPlural: string;
            isCustom: boolean;
            isActive: boolean;
            fields: {
              edges: Array<{
                node: {
                  id: string;
                  name: string;
                  label: string;
                  type: string;
                  isCustom: boolean;
                };
              }>;
            };
          };
        }>;
      };
    }>(query);

    const postCardObject = data.objects.edges.find(
      (edge) => edge.node.nameSingular === 'postCard',
    );

    expect(postCardObject).toBeDefined();
    expect(postCardObject!.node.namePlural).toBe('postCards');
    expect(postCardObject!.node.labelSingular).toBe('Post card');
    expect(postCardObject!.node.labelPlural).toBe('Post cards');
    expect(postCardObject!.node.isCustom).toBe(true);
    expect(postCardObject!.node.isActive).toBe(true);

    const contentField = postCardObject!.node.fields.edges.find(
      (edge) => edge.node.name === 'content',
    );

    expect(contentField).toBeDefined();
    expect(contentField!.node.label).toBe('Content');
    expect(contentField!.node.isCustom).toBe(true);
  });
});
