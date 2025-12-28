import { redirect } from 'next/navigation';
import { IBM_CONFIG } from '@/lib/ibm-config';

export async function GET() {
    const params = new URLSearchParams({
        client_id: IBM_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: IBM_CONFIG.redirectUri,
        scope: 'openid',
    });

    const authUrl = `${IBM_CONFIG.oauthServerUrl}/authorization?${params.toString()}`;

    redirect(authUrl);
}
