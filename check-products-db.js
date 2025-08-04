#!/usr/bin/env node

// Simple database check without dependencies
import { createConnection } from 'mysql2/promise';

async function checkProducts() {
  try {
    const connection = await createConnection({
      host: '5.161.52.206',
      port: 3232,
      user: 'tropical',
      password: '805ce7692e5b4d6ced5f',
      database: 'tropical'
    });

    console.log('🔍 Checking products in database...\n');

    // Check products table
    const [products] = await connection.execute(
      'SELECT id, name, photo FROM products WHERE active = true LIMIT 5'
    );

    console.log('📦 Active products:');
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - photo: ${p.photo || 'null'}`);
    });

    // Check product_color_variants table
    const [variants] = await connection.execute(`
      SELECT pcv.id, pcv.variant_name, pcv.image_url, p.name as product_name
      FROM product_color_variants pcv 
      LEFT JOIN products p ON pcv.product_id = p.id
      WHERE pcv.active = true 
      LIMIT 10
    `);

    console.log('\n🎨 Color variants:');
    variants.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.product_name} - ${v.variant_name} - image_url: ${v.image_url || 'null'}`);
    });

    // Check product_color_grades
    const [grades] = await connection.execute(`
      SELECT pcg.product_id, p.name as product_name, c.name as color_name
      FROM product_color_grades pcg
      LEFT JOIN products p ON pcg.product_id = p.id
      LEFT JOIN colors c ON pcg.color_id = c.id
      LIMIT 10
    `);

    console.log('\n📊 Product-color grades:');
    grades.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.product_name} - ${g.color_name}`);
    });

    await connection.end();

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkProducts();
