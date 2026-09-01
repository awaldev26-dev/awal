import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { StockageMedias } from './types.js'

/** R2 parle le protocole S3 : un client S3 pointé sur l'endpoint du compte suffit. */
export class StockageR2 implements StockageMedias {
  private readonly client: S3Client

  constructor(
    private readonly bucket: string,
    private readonly base: string,
    compteId: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${compteId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async ecrire(cle: string, donnees: Uint8Array, typeMime: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: cle, Body: donnees, ContentType: typeMime }),
    )
  }

  async lire(cle: string): Promise<Uint8Array | null> {
    try {
      const reponse = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: cle }))
      const octets = await reponse.Body?.transformToByteArray()
      return octets ? new Uint8Array(octets) : null
    } catch {
      return null
    }
  }

  async existe(cle: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: cle }))
      return true
    } catch {
      return false
    }
  }

  urlPublique(): string {
    return this.base
  }
}
