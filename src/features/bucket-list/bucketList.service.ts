import { supabase } from '../../lib/supabase.ts';
import { BucketItem } from './types';

const MAX_BUCKET_TITLE_LENGTH = 50;

function normalizeBucketTitle(title: string) {
  const trimmedTitle = title.trim();

  if (
    trimmedTitle.length === 0 ||
    trimmedTitle.length > MAX_BUCKET_TITLE_LENGTH
  ) {
    throw new Error(
      `버킷리스트는 1자 이상 ${MAX_BUCKET_TITLE_LENGTH}자 이하로 입력해 주세요.`,
    );
  }

  return trimmedTitle;
}

function mapBucketItem(row: {
  id: string;
  ticket_book_id: string;
  title: string;
  is_completed: boolean;
  display_order: number;
}): BucketItem {
  return {
    id: row.id,
    ticketBookId: row.ticket_book_id,
    title: row.title,
    isCompleted: row.is_completed,
    displayOrder: row.display_order,
  };
}

export async function getBucketItems(ticketBookIds: string[]) {
  if (ticketBookIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('bucket_items')
    .select('id, ticket_book_id, title, is_completed, display_order')
    .in('ticket_book_id', ticketBookIds)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(mapBucketItem);
}

export async function createBucketItem(ticketBookId: string, title: string) {
  const normalizedTitle = normalizeBucketTitle(title);
  const { data: lastBucketItem, error: orderError } = await supabase
    .from('bucket_items')
    .select('display_order')
    .eq('ticket_book_id', ticketBookId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  const { data, error } = await supabase
    .from('bucket_items')
    .insert({
      ticket_book_id: ticketBookId,
      title: normalizedTitle,
      display_order: (lastBucketItem?.display_order ?? 0) + 1,
    })
    .select('id, ticket_book_id, title, is_completed, display_order')
    .single();

  if (error) {
    throw error;
  }

  return mapBucketItem(data);
}

export async function updateBucketItemTitle(
  bucketItemId: string,
  title: string,
) {
  const normalizedTitle = normalizeBucketTitle(title);
  const { data, error } = await supabase
    .from('bucket_items')
    .update({ title: normalizedTitle })
    .eq('id', bucketItemId)
    .select('id, ticket_book_id, title, is_completed, display_order')
    .single();

  if (error) {
    throw error;
  }

  return mapBucketItem(data);
}

export async function updateBucketItemCompleted(
  bucketItemId: string,
  isCompleted: boolean,
) {
  const { data, error } = await supabase
    .from('bucket_items')
    .update({ is_completed: isCompleted })
    .eq('id', bucketItemId)
    .select('id, ticket_book_id, title, is_completed, display_order')
    .single();

  if (error) {
    throw error;
  }

  return mapBucketItem(data);
}

export async function deleteBucketItem(bucketItemId: string) {
  const { error } = await supabase
    .from('bucket_items')
    .delete()
    .eq('id', bucketItemId)
    .select('id')
    .single();

  if (error) {
    throw error;
  }
}

export async function restoreBucketItem(bucketItem: BucketItem) {
  const normalizedTitle = normalizeBucketTitle(bucketItem.title);
  const { data, error } = await supabase
    .from('bucket_items')
    .insert({
      id: bucketItem.id,
      ticket_book_id: bucketItem.ticketBookId,
      title: normalizedTitle,
      is_completed: bucketItem.isCompleted,
      display_order: bucketItem.displayOrder,
    })
    .select('id, ticket_book_id, title, is_completed, display_order')
    .single();

  if (error) {
    throw error;
  }

  return mapBucketItem(data);
}
