import { NextResponse, type NextRequest } from 'next/server'
import { NOM_COOKIE, verifierSession } from './auth/session.js'

export async function middleware(requete: NextRequest) {
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
