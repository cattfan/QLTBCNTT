import { BadRequestException } from '@nestjs/common';

export interface PaginationQuery {
  page?: string;
  pageSize?: string;
  search?: string;
}

export interface PaginationResult<TItem> {
  items: TItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
  };
}

export abstract class BaseCrudService {
  protected buildPaginatedSearchResult<TItem>(
    items: TItem[],
    query: PaginationQuery,
    options: {
      matchesSearch: (item: TItem, normalizedSearch: string) => boolean;
      sort: (left: TItem, right: TItem) => number;
    },
  ): PaginationResult<TItem> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const pageSize = this.parsePositiveInteger(query.pageSize, 10, 'pageSize');
    const search = query.search?.trim() ?? '';
    const normalizedSearch = search.toLowerCase();

    const filteredItems = items
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return options.matchesSearch(item, normalizedSearch);
      })
      .sort(options.sort);

    const totalItems = filteredItems.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    return {
      items: filteredItems.slice(offset, offset + pageSize),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      filters: {
        search,
      },
    };
  }

  protected resolveRequiredText(
    value: unknown,
    fallbackValue: string | undefined,
    allowPartial: boolean,
    fieldName: string,
  ): string {
    if (value === undefined && allowPartial && fallbackValue) {
      return fallbackValue;
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return value.trim();
  }

  protected resolveOptionalText(
    value: unknown,
    fallbackValue: string | undefined,
  ): string {
    if (value === undefined) {
      return fallbackValue ?? '';
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('description must be a string');
    }

    return value.trim();
  }

  protected parsePositiveInteger(
    value: string | undefined,
    fallbackValue: number,
    fieldName: string,
  ): number {
    if (value === undefined || value.trim() === '') {
      return fallbackValue;
    }

    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }
}
