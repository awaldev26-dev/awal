'use client'

import { useRouter } from 'next/navigation'
import { Trouver } from '../ecrans/Trouver'

export default function PageTrouver() {
  const router = useRouter()
  return <Trouver onRetour={() => router.push('/')} />
}
