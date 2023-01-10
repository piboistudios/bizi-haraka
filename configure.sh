DEBUG_DEPTH=5 DEBUG=* \
node \
configure \
--in=config-templates \
--out=config \
--db-user=root \
--db-pass=iW@6vDv5LDC5 \
--db-host=mongo \
--db-port=27017 \
--db-auth-source=admin \
--db-collection=test \
--ldap-main-server=ldap://bizi-ldap:389 \
--ldap-base-dn='ou=users,dc=gabedev,dc=directory' \
--ldap-bind-user='uid=admin,ou=users,dc=gabedev,dc=directory' \
--ldap-bind-pass=CmZeuEUQbf3IpX \
--domain='{"name":"gabedev.email","ldap": {"server":"ldap://bizi-ldap:389","binddn":"uid=admin,ou=users,dc=gabedev,dc=directory","bindpw":"CmZeuEUQbf3IpX","basedn":"ou=users,dc=gabedev,dc=directory"}}' \
--domain='{"name":"gabedev.tech","ldap": {"server":"ldap://bizi-ldap:389","binddn":"uid=admin,ou=users,dc=gabedev,dc=directory","bindpw":"CmZeuEUQbf3IpX","basedn":"ou=users,dc=gabedev,dc=directory"}}' \
