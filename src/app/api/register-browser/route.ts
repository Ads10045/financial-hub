import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { userAgent, timestamp } = data;

        if (!userAgent) {
            return NextResponse.json({ error: 'User agent is required' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'src', 'data', 'browsers.json');

        // Read existing data
        let browsers = [];
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            try {
                browsers = JSON.parse(fileContent);
            } catch (e) {
                browsers = [];
            }
        }

        // Add new entry
        const newEntry = {
            id: Date.now().toString(),
            userAgent,
            timestamp: timestamp || new Date().toISOString(),
            ip: request.headers.get('x-forwarded-for') || 'unknown'
        };

        browsers.push(newEntry);

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(browsers, null, 2));

        return NextResponse.json({ success: true, message: 'Browser registered successfully', entry: newEntry });

    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
