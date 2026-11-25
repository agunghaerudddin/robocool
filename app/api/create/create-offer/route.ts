import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer_id,
      company,
      recipient,
      address,
      letter_date,
      subject,
      opening,
      subtotal,
      include_tax,
      tax,
      total,
      valid_days,
      terms,
      signer,
      position,
      status,
      items,
    } = body;

    if (!company || !company.trim()) {
      return NextResponse.json(
        { error: "Nama perusahaan / perorangan (company) wajib diisi." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Rincian penawaran (items) wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Generate letter number, e.g., 001/SPH/XI/2026
    const dateObj = letter_date ? new Date(letter_date) : new Date();
    const year = dateObj.getFullYear() || new Date().getFullYear();
    const month = dateObj.getMonth() + 1 || new Date().getMonth() + 1;
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const romanMonth = romanMonths[month - 1] || "I";

    // Count existing offers to get sequence
    const { count } = await supabase
      .from("overs")
      .select("*", { count: "exact", head: true });

    const sequence = String((count || 0) + 1).padStart(3, "0");
    const letterNumber = `${sequence}/SPH/${romanMonth}/${year}`;

    // Insert into overs
    const { data: overData, error: overError } = await supabase
      .from("overs")
      .insert({
        number: letterNumber,
        customer_id: customer_id || null,
        company: company.trim(),
        recipient: recipient ? recipient.trim() : null,
        address: address ? address.trim() : null,
        letter_date: letter_date || new Date().toISOString().split("T")[0],
        subject: subject || "Penawaran Harga Jasa Service AC",
        opening: opening || null,
        subtotal: Number(subtotal) || 0,
        include_tax: Boolean(include_tax),
        tax: Number(tax) || 0,
        total: Number(total) || 0,
        valid_days: Number(valid_days) || 14,
        terms: terms || null,
        signer: signer ? signer.trim() : null,
        position: position ? position.trim() : null,
        status: status || "draft",
      })
      .select()
      .single();

    if (overError) {
      console.error("Failed to insert into overs:", overError);
      return NextResponse.json(
        { error: `Failed to create offer: ${overError.message}` },
        { status: 500 }
      );
    }

    // Insert items
    const overItemsToInsert = items.map((item: any) => ({
      over_id: overData.id,
      description: item.description?.trim() || "",
      quantity: Number(item.quantity) || 1,
      unit: item.unit?.trim() || "unit",
      price: Number(item.price) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    }));

    const { error: itemsError } = await supabase
      .from("over_items")
      .insert(overItemsToInsert);

    if (itemsError) {
      console.error("Failed to insert over_items:", itemsError);
      return NextResponse.json(
        { error: `Failed to create offer items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Surat penawaran berhasil dibuat.",
        data: overData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create offer error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
