CREATE OR REPLACE FUNCTION match_clauses (
  query_embedding vector(1536), -- Ensure this matches your embedding dimension
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  template_filter_id uuid DEFAULT NULL, -- Change type to UUID
  is_reference_filter boolean DEFAULT NULL 
)
RETURNS TABLE (
  id bigint, -- Assuming clause.id is still bigint
  text text,
  template_id uuid, -- Assuming clause.template_id is uuid
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.text,
    c.template_id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM
    clauses c
  JOIN 
    templates t ON c.template_id = t.id
  WHERE 
    1 - (c.embedding <=> query_embedding) > match_threshold
    -- Compare UUIDs directly
    AND (template_filter_id IS NULL OR c.template_id = template_filter_id) 
    AND (is_reference_filter IS NULL OR t.is_reference = is_reference_filter) 
  ORDER BY
    c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 