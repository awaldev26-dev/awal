'use client'

import { useRouter } from 'next/navigation'
import { Explorer } from '../ecrans/Explorer'

export default function PageExplorer() {
  const router = useRouter()
  return <Explorer onRetour={() => router.push('/')} />
}
