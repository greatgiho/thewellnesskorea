-- ============================================================================
-- Add search_partners_by_name function for partner community author search
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_partners_by_name(search_term text)
RETURNS SETOF uuid
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT id
  FROM public.partners
  WHERE name_ko ILIKE ('%' || search_term || '%')
     OR name_en ILIKE ('%' || search_term || '%');
END;
$$;

-- 이 함수에 대한 모든 사용자(authenticated role)에게 실행 권한 부여 (RLS가 적용되므로 안전)
GRANT EXECUTE ON FUNCTION public.search_partners_by_name(text) TO authenticated;
