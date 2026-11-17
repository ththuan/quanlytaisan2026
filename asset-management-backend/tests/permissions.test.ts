import {
  getRoleDefaultPermissions,
  ROLE_DEFAULT_PERMISSIONS,
} from '../src/constants/permissions';

describe('default feature permissions', () => {
  it('gives admin full access to repair and construction', () => {
    const admin = getRoleDefaultPermissions('admin');
    expect(admin.get('maintenance.view')).toBe('all');
    expect(admin.get('maintenance.execute')).toBe('all');
    expect(admin.get('construction.view')).toBe('all');
    expect(admin.get('construction.create')).toBe('all');
  });

  it('allows director to see and approve all repair requests', () => {
    const director = getRoleDefaultPermissions('director');
    expect(director.get('maintenance.view')).toBe('all');
    expect(director.get('maintenance.approve')).toBe('all');
  });

  it('requires explicit grants for department heads and staff', () => {
    for (const role of ['department_head', 'staff'] as const) {
      const permissions = getRoleDefaultPermissions(role);
      expect(permissions.has('maintenance.view')).toBe(false);
      expect(permissions.has('maintenance.create')).toBe(false);
      expect(permissions.has('construction.view')).toBe(false);
    }
  });

  it('does not include repair permissions in the default role catalog', () => {
    const defaults = ROLE_DEFAULT_PERMISSIONS.filter((entry) =>
      ['department_head', 'staff'].includes(entry.role),
    );
    const codes = defaults.flatMap((entry) =>
      entry.permissions.map((permission) => permission.code),
    );
    expect(codes.some((code) => code.startsWith('maintenance.'))).toBe(false);
    expect(codes.some((code) => code.startsWith('construction.'))).toBe(false);
  });
});
