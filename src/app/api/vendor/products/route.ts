import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await localDB.findUserByEmail(session.user.email)
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 })
    }

    let products = await localDB.getProductsByVendor(user.id)

    if (!products.length) {
      await localDB.seedDemoProducts()
      products = await localDB.getProductsByVendor(user.id)
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching vendor products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor products' },
      { status: 500 }
    )
  }
}
