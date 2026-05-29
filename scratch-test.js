import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cpfeidjtksjwrworaycx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZmVpZGp0a3Nqd3J3b3JheWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzYyMDMsImV4cCI6MjA5MDIxMjIwM30.KglTOfuhKm7tFtvPUTzPG370m7PrNEZ9AAF4y5BywIg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log('MEMBERS:');
  members.forEach(m => {
    console.log(`- ID: ${m.id}, Name: ${m.full_name}, Plan: ${m.membership_plan}, Status: ${m.payment_status}, Expected Amount: ${m.payment_amount} (${typeof m.payment_amount})`);
  });

  const { data: logs, error: logsError } = await supabase
    .from('payment_logs')
    .select('*')
    .limit(10);

  if (logsError) {
    console.error('Error fetching logs:', logsError);
    return;
  }

  console.log('\nPAYMENT LOGS:');
  logs.forEach(l => {
    console.log(`- ID: ${l.id}, Member: ${l.member_name}, MemberID: ${l.member_id}, Amount: ${l.amount} (${typeof l.amount}), Created At: ${l.created_at}`);
  });
}

main();
