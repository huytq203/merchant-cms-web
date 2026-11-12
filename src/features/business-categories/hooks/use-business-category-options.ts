import { useQuery } from "@tanstack/react-query";
import { businessCategoryQueries } from "../queries";
import { businessCategoryOptions } from "../utils";

/** Lựa chọn dropdown ngành nghề; `current` là giá trị đang lưu để không mất khi nó ngoài danh mục. */
export function useBusinessCategoryOptions(current?: string | null, enabled = true) {
  const query = useQuery({ ...businessCategoryQueries.list(), enabled });
  return {
    options: businessCategoryOptions(query.data, current),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
