import { NextResponse, type NextRequest } from 'next/server'
import { NOM_COOKIE, verifierSession } from './auth/session'

/**
 * Barrière d'entrée : redirige vers la connexion tant que le cookie de session
 * n'est pas valide.
 *
 * S'appelait « middleware » avant Next 16, qui a renommé la convention en
 * « proxy » — le fonctionnement est identique.
 *
 * La documentation déconseille d'en faire la seule autorisation : c'est un
 * contrôle optimiste, qui épargne le rendu d'une page inaccessible. Les
 * actions qui écrivent vérifient donc la session de leur côté.
 */
export async function proxy(requete: NextRequest) {
  if (await verifierSession(requete.cookies.get(NOM_COOKIE)?.value)) {
    return NextResponse.next()
  }
  const url = requete.nextUrl.clone()
  url.pathname = '/connexion'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!connexion|_next/static|_next/image|favicon.ico|medias).*)'],
}
