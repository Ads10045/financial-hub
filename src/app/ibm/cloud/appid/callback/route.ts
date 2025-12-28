import { NextRequest, NextResponse } from 'next/server';
import { IBM_CONFIG } from '@/lib/ibm-config';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const tokenResponse = await fetch(`${IBM_CONFIG.oauthServerUrl}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: IBM_CONFIG.clientId,
                grant_type: 'authorization_code',
                redirect_uri: IBM_CONFIG.redirectUri,
                code: code,
                client_secret: IBM_CONFIG.secret,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('IBM Token Error:', tokenResponse.status, errorText);
            return NextResponse.json({ error: 'Failed to exchange token', details: errorText }, { status: 400 });
        }

        const tokens = await tokenResponse.json();

        // Create response redirecting to dashboard
        const response = NextResponse.redirect(new URL('/dashboard', request.url));

        // Set cookie (valid for 7 days)
        response.cookies.set('auth_token', tokens.access_token || 'ibm-session-valid', {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
        });

        return response;

    } catch (error) {
        console.error('IBM Auth Error:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
    }
}
