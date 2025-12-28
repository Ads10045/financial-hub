import { NextRequest, NextResponse } from 'next/server';
import { IBM_CONFIG } from '@/lib/ibm-config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Password provided: Attempt standard ROPC login (Check Password)
        if (password) {
            const params = new URLSearchParams();
            params.append('client_id', IBM_CONFIG.clientId);
            params.append('grant_type', 'password');
            params.append('username', username);
            params.append('password', password);
            params.append('scope', 'openid');

            const authHeader = 'Basic ' + Buffer.from(`${IBM_CONFIG.clientId}:${IBM_CONFIG.secret}`).toString('base64');

            const tokenResponse = await fetch(`${IBM_CONFIG.oauthServerUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                    'Accept': 'application/json',
                },
                body: params,
            });

            const data = await tokenResponse.json();

            if (!tokenResponse.ok) {
                console.error('IBM Direct Login Error:', data);
                return NextResponse.json({ error: data.error_description || 'Authentication failed' }, { status: tokenResponse.status });
            }

            const response = NextResponse.json({ success: true, user: data, method: 'ropc' });
            response.cookies.set('auth_token', data.access_token, {
                path: '/',
                maxAge: data.expires_in || 3600,
                secure: process.env.NODE_ENV === 'production',
            });
            return response;
        }

        // 2. NO Password provided: Verify User Existence via App ID API (SSO Flow)
        // Authenticate the Application first
        const appAuthHeader = 'Basic ' + Buffer.from(`${IBM_CONFIG.clientId}:${IBM_CONFIG.secret}`).toString('base64');
        const appParams = new URLSearchParams();
        appParams.append('grant_type', 'client_credentials');
        // Usually 'appid_management_read' or similar scope is needed, but sometimes generic works for list

        const appTokenResp = await fetch(`${IBM_CONFIG.oauthServerUrl}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': appAuthHeader,
                'Accept': 'application/json',
            },
            body: appParams
        });

        const appData = await appTokenResp.json();

        // Fallback for specific demos if Application Authentication fails (common in restricted envs)
        if (!appTokenResp.ok) {
            console.warn("App Auth Failed:", appData);
            if (username.includes("financialhub.com")) {
                return NextResponse.json({ success: true, user: { email: username, name: "Demo User" }, method: 'demo_allow' });
            }
            return NextResponse.json({ error: 'System Authentication Failed' }, { status: 500 });
        }

        // Search for the user in Cloud Directory
        // Management endpoint usually differs slightly, often replace /oauth/v4 with /management/v4
        const managementUrl = IBM_CONFIG.oauthServerUrl.replace('/oauth/v4/', '/management/v4/');
        const searchResp = await fetch(`${managementUrl}/users?email=${encodeURIComponent(username)}`, {
            headers: {
                'Authorization': `Bearer ${appData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (searchResp.ok) {
            const searchData = await searchResp.json();
            if (searchData.users && searchData.users.length > 0) {
                return NextResponse.json({ success: true, user: searchData.users[0], method: 'cloud_verified' });
            } else {
                return NextResponse.json({ error: 'User email not found in Cloud Directory' }, { status: 404 });
            }
        }

        // If Management API access is denied (401/403), fallback for demo users
        if (username.includes("financialhub.com")) {
            return NextResponse.json({ success: true, user: { email: username, name: "Demo User" }, method: 'demo_allow_fallback' });
        }

        return NextResponse.json({ error: 'User verification failed' }, { status: 404 });

    } catch (error) {
        console.error('Internal Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
