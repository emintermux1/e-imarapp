"""initial_postgis_tables

Revision ID: 001
Revises: 
Create Date: 2024-05-08 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    
    # municipalities
    op.create_table(
        'municipalities',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('province', sa.String(), nullable=True),
        sa.Column('district', sa.String(), nullable=True),
        sa.Column('slug', sa.String(), unique=True, nullable=False, index=True),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('population_2023', sa.Integer(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('keos_url', sa.String(), nullable=True),
        sa.Column('wms_url', sa.String(), nullable=True),
        sa.Column('wfs_url', sa.String(), nullable=True),
        sa.Column('ogc_capabilities_json', sa.Text(), nullable=True),
        sa.Column('discovered_at', sa.DateTime(), nullable=True),
    )
    
    # parcels
    op.create_table(
        'parcels',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('province', sa.String(), nullable=True, index=True),
        sa.Column('district', sa.String(), nullable=True, index=True),
        sa.Column('municipality', sa.String(), nullable=True, index=True),
        sa.Column('ada', sa.String(), nullable=False),
        sa.Column('parsel', sa.String(), nullable=False),
        sa.Column('geom', Geometry('MULTIPOLYGON', srid=4326), nullable=True),
        sa.Column('tapu_status', sa.String(), nullable=True),
        sa.Column('nitelik', sa.String(), nullable=True),
        sa.Column('alan_m2', sa.Float(), nullable=True),
        sa.Column('mahalle', sa.String(), nullable=True),
    )
    op.create_index('ix_parcels_ada_parsel', 'parcels', ['ada', 'parsel'])
    
    # plans
    op.create_table(
        'plans',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('municipality_id', sa.Integer(), nullable=True),
        sa.Column('plan_type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True, index=True),
        sa.Column('geom', Geometry('MULTIPOLYGON', srid=4326), nullable=True),
        sa.Column('aski_start', sa.Date(), nullable=True),
        sa.Column('aski_end', sa.Date(), nullable=True),
        sa.Column('pdf_url', sa.String(), nullable=True),
        sa.Column('gml_url', sa.String(), nullable=True),
    )
    
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('email', sa.String(), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    
    # watchlist
    op.create_table(
        'watchlist',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parcel_id', sa.Integer(), nullable=True),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('geom_wkt', sa.String(), nullable=True),
        sa.Column('notification_channels', sa.String(), nullable=True),
        sa.Column('label', sa.String(), nullable=True),
    )
    
    # reports
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parcel_id', sa.Integer(), nullable=True),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('pdf_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    
    # query_logs
    op.create_table(
        'query_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('query_type', sa.String(), nullable=True),
        sa.Column('params', sa.String(), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=True),
        sa.Column('geom', Geometry('POINT', srid=4326), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('query_logs')
    op.drop_table('reports')
    op.drop_table('watchlist')
    op.drop_table('users')
    op.drop_table('plans')
    op.drop_index('ix_parcels_ada_parsel', table_name='parcels')
    op.drop_table('parcels')
    op.drop_table('municipalities')
